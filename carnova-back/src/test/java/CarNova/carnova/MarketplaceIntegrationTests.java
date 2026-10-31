package CarNova.carnova;
import CarNova.carnova.entity.*;
import CarNova.carnova.repository.*;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
@SpringBootTest @AutoConfigureMockMvc @Transactional
class MarketplaceIntegrationTests {
 @Autowired MockMvc mvc;
 @Autowired ObjectMapper json;
 @Autowired UserRepository users;
 @Autowired AnnonceRepository listings;
 @Autowired ShowroomRepository showrooms;
 @Autowired PasswordEncoder passwords;
 private static final String INPUT="""
 {"titre":"BMW Série 3 test","description":"Historique documenté et entretien régulier.","typeAnnonce":"VENTE","marque":"BMW","modele":"320i","annee":2022,"prix":148000,"kilometrage":32000,"carburant":"ESSENCE","boiteVitesse":"AUTOMATIQUE","couleur":"Bleu","ville":"Tunis","typeVehicule":"BERLINE","telephone":"+216 71000000","images":[]}
 """;
 private User owner(String email){var u=new User();u.email=email;u.nom="Test";u.prenom="User";u.role="ROLE_USER";u.password=passwords.encode("TestPassword123!");return users.save(u);}
 private Annonce car(User u){var a=new Annonce();a.user=u;a.titre="BMW Série 3";a.description="Test listing";a.marque="BMW";a.prix=new BigDecimal("148000");return listings.save(a);}
 @Test void signupCannotGrantAdminAndHashesPasswords() throws Exception {
  mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"Test\",\"prenom\":\"Client\",\"email\":\"NEW@example.com\",\"password\":\"TestPassword123!\",\"role\":\"ROLE_ADMIN\"}")).andExpect(status().isCreated());
  var u=users.findByEmailIgnoreCase("new@example.com").orElseThrow();assertThat(u.role).isEqualTo("ROLE_USER");assertThat(u.password).isNotEqualTo("TestPassword123!");assertThat(passwords.matches("TestPassword123!",u.password)).isTrue();
 }
 @Test void invalidAndDuplicateSignupRejected() throws Exception {
  mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"bad\",\"password\":\"x\"}")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.email").exists());
  owner("exists@example.com");
  mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"T\",\"prenom\":\"T\",\"email\":\"EXISTS@example.com\",\"password\":\"TestPassword123!\"}")).andExpect(status().isConflict());
 }
 @Test void loginIssuesUsableExpiringToken() throws Exception {
  owner("login@example.com");
  var result=mvc.perform(post("/api/auth/signin").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"LOGIN@example.com\",\"password\":\"TestPassword123!\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.expiresIn").value(3600)).andReturn();
  String token=json.readTree(result.getResponse().getContentAsString()).get("token").asText();
  mvc.perform(get("/api/auth/me").header("Authorization","Bearer "+token)).andExpect(status().isOk()).andExpect(jsonPath("$.password").doesNotExist());
  mvc.perform(get("/api/auth/me").header("Authorization","Bearer "+token+"x")).andExpect(status().isUnauthorized());
 }
 @Test void badLoginReturnsGenericUnauthorized() throws Exception {
  mvc.perform(post("/api/auth/signin").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"nobody@example.com\",\"password\":\"TestPassword123!\"}")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.message").value("E-mail ou mot de passe incorrect."));
 }
 @Test void searchFiltersWithoutLeakingPrivateUserFields() throws Exception {
  car(owner("private@example.com"));
  mvc.perform(get("/api/annonces/search").param("marque","BMW").param("maxPrice","150000")).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1)).andExpect(jsonPath("$.items[0].user.password").doesNotExist()).andExpect(jsonPath("$.items[0].user.email").doesNotExist());
  mvc.perform(get("/api/annonces/search").param("maxPrice","100000")).andExpect(jsonPath("$.total").value(0));
  mvc.perform(get("/api/annonces/search").param("size","10000")).andExpect(status().isBadRequest());
 }
 @Test void listingCreationRequiresAuthAndValidSpecs() throws Exception {
  mvc.perform(post("/api/annonces").contentType(MediaType.APPLICATION_JSON).content(INPUT)).andExpect(status().isUnauthorized());owner("seller@example.com");
  mvc.perform(post("/api/annonces").with(user("seller@example.com")).contentType(MediaType.APPLICATION_JSON).content(INPUT)).andExpect(status().isCreated()).andExpect(jsonPath("$.prix").value(148000));
  mvc.perform(post("/api/annonces").with(user("seller@example.com")).contentType(MediaType.APPLICATION_JSON).content(INPUT.replace("148000","-1"))).andExpect(status().isBadRequest());
 }
 @Test void otherUsersCannotMutateListingOrAttachModel() throws Exception {
  var a=car(owner("owner@example.com"));owner("intruder@example.com");
  mvc.perform(delete("/api/annonces/"+a.id).with(user("intruder@example.com"))).andExpect(status().isForbidden());
  mvc.perform(put("/api/annonces/"+a.id).with(user("intruder@example.com")).contentType(MediaType.APPLICATION_JSON).content(INPUT)).andExpect(status().isForbidden());
  mvc.perform(multipart("/api/models/upload").file(new MockMultipartFile("glb","x.glb","model/gltf-binary",new byte[]{1})).param("annonceId",a.id.toString()).with(user("intruder@example.com"))).andExpect(status().isForbidden());assertThat(listings.existsById(a.id)).isTrue();
 }
 @Test void showroomDeleteIsOwnerScoped() throws Exception {
  var s=new Showroom();s.user=owner("showroom@example.com");s.nom="Collection";showrooms.save(s);owner("stranger@example.com");
  mvc.perform(delete("/api/showrooms/"+s.id).with(user("stranger@example.com"))).andExpect(status().isForbidden());
  mvc.perform(get("/api/showrooms/"+s.id)).andExpect(status().isOk()).andExpect(jsonPath("$.user.password").doesNotExist());
 }
 @Test void spoofedUploadsAreRejected() throws Exception {
  owner("image@example.com");
  mvc.perform(multipart("/api/uploads").file(new MockMultipartFile("image","evil.png","image/png","not an image".getBytes())).with(user("image@example.com"))).andExpect(status().isBadRequest());
  mvc.perform(multipart("/api/models/upload").file(new MockMultipartFile("glb","spoof.glb","model/gltf-binary",new byte[]{0,1,2})).with(user("image@example.com"))).andExpect(status().isBadRequest());
 }
 @Test void publicMutationsDebugAndAdminAreProtected() throws Exception {
  mvc.perform(post("/api/news/refresh")).andExpect(status().isUnauthorized());
  mvc.perform(post("/api/news/_seed").with(user("normal@example.com"))).andExpect(status().isForbidden());
  mvc.perform(get("/api/admin/overview").with(user("normal@example.com"))).andExpect(status().isForbidden());
  mvc.perform(get("/api/news/debug/ping").param("url","http://127.0.0.1").with(user("normal@example.com"))).andExpect(status().isForbidden());
  mvc.perform(get("/api/admin/overview").with(user("admin@example.com").roles("ADMIN"))).andExpect(status().isOk()).andExpect(jsonPath("$.months.length()").value(6));
 }
 @Test void billingUsesServerPriceAndPaymentOwner() throws Exception {
  owner("payer@example.com");owner("other@example.com");
  var r=mvc.perform(post("/api/payments/create-payment-intent").with(user("payer@example.com")).contentType(MediaType.APPLICATION_JSON).content("{\"amount\":0.01}")).andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(500)).andReturn();
  String id=json.readTree(r.getResponse().getContentAsString()).get("paymentIntentId").asText();
  mvc.perform(post("/api/payments/confirm").with(user("other@example.com")).contentType(MediaType.APPLICATION_JSON).content("{\"paymentIntentId\":\""+id+"\"}")).andExpect(status().isForbidden());
  mvc.perform(post("/api/payments/confirm").with(user("payer@example.com")).contentType(MediaType.APPLICATION_JSON).content("{\"paymentIntentId\":\""+id+"\"}")).andExpect(status().isOk());
 }
 @Test void assistantWorksOfflineAndValidatesMessage() throws Exception {
  mvc.perform(post("/api/assistant/chat").contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"Quels documents vérifier ?\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.provider").value("offline")).andExpect(jsonPath("$.answer").value(org.hamcrest.Matchers.containsString("carte grise")));
  mvc.perform(post("/api/assistant/chat").contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"\"}")).andExpect(status().isBadRequest());
 }
 @Test void contactAndOpenApiWork() throws Exception {
  mvc.perform(post("/api/contact").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Test\",\"email\":\"test@example.com\",\"message\":\"Bonjour, une question sur CarNova.\"}")).andExpect(status().isCreated());
  mvc.perform(get("/v3/api-docs")).andExpect(status().isOk()).andExpect(jsonPath("$.openapi").exists());
 }
 @Test void corsRejectsUntrustedOrigin() throws Exception {
  mvc.perform(options("/api/auth/signin").header("Origin","https://untrusted.example").header("Access-Control-Request-Method","POST")).andExpect(status().isForbidden());
  mvc.perform(options("/api/auth/signin").header("Origin","http://localhost:4200").header("Access-Control-Request-Method","POST")).andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin","http://localhost:4200"));
 }
}

package CarNova.carnova.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import javax.imageio.ImageIO;
import java.io.*;
import java.nio.*;
import java.nio.file.*;
import java.util.UUID;
@Service
public class FileStorage {
 private final Path uploads,models;
 public FileStorage(@Value("${app.uploads-dir}") String uploads,@Value("${app.models-dir}") String models) throws IOException {this.uploads=Path.of(uploads).toAbsolutePath().normalize();this.models=Path.of(models).toAbsolutePath().normalize();Files.createDirectories(this.uploads);Files.createDirectories(this.models);}
 public String image(MultipartFile file) throws IOException {
  if(file==null||file.isEmpty()||file.getSize()>8*1024*1024) throw bad("Image requise, 8 Mo maximum.");
  try(var input=ImageIO.createImageInputStream(file.getInputStream())) {
   var readers=ImageIO.getImageReaders(input);if(!readers.hasNext()) throw bad("Utilisez une image JPEG ou PNG valide.");
   var reader=readers.next();try {
    if(!java.util.Set.of("JPEG","PNG").contains(reader.getFormatName().toUpperCase())) throw bad("Format non pris en charge.");
    reader.setInput(input);int w=reader.getWidth(0),h=reader.getHeight(0);
    if(w<100||h<100||(long)w*h>24000000) throw bad("Dimensions acceptées : au moins 100 × 100, maximum 24 mégapixels.");
    var image=reader.read(0);String name=UUID.randomUUID()+".png";
    ImageIO.write(image,"png",uploads.resolve(name).toFile());return "/uploads/"+name;
   } finally {reader.dispose();}
  }
 }
 public String model(MultipartFile file) throws IOException {
  if(file==null||file.isEmpty()||file.getSize()>40L*1024*1024) throw bad("Modèle GLB requis, 40 Mo maximum.");
  byte[] bytes=file.getBytes();if(bytes.length<20) throw bad("GLB invalide.");
  var b=ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
  if(b.getInt()!=0x46546c67||b.getInt()!=2||b.getInt()!=bytes.length) throw bad("GLB 2.0 invalide.");
  int length=b.getInt();if(b.getInt()!=0x4e4f534a||length<=0||length>bytes.length-20) throw bad("Structure GLB invalide.");
  com.fasterxml.jackson.databind.JsonNode json;
  try {json=new ObjectMapper().readTree(new String(bytes,20,length,java.nio.charset.StandardCharsets.UTF_8));}catch(Exception e){throw bad("Données GLB invalides.");}
  for(String collection:new String[]{"buffers","images"}) for(var item:json.path(collection)) if(item.has("uri")&&!item.get("uri").asText().startsWith("data:")) throw bad("Le modèle doit embarquer ses textures et données.");
  String name=UUID.randomUUID()+".glb";Files.write(models.resolve(name),bytes,StandardOpenOption.CREATE_NEW);return "/api/models/"+name;
 }
 public Path resolve(String name,boolean model) throws IOException {
  Path root=(model?models:uploads).toRealPath();
  if(name.contains("/")||name.contains("\\")||name.contains("..")) throw bad("Nom de fichier invalide.");
  Path path=root.resolve(name).normalize();if(!path.startsWith(root)||!Files.isRegularFile(path)||!path.toRealPath().startsWith(root)) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Fichier introuvable.");
  if(model&&!name.endsWith(".glb")) throw bad("Format invalide.");
  if(!model&&!name.toLowerCase().matches(".*\\.(png|jpe?g|webp|avif)")) throw bad("Format invalide.");
  return path;
 }
 private ResponseStatusException bad(String message) {return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
}

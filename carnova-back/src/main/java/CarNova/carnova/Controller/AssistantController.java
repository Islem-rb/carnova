package CarNova.carnova.Controller;

import CarNova.carnova.Entity.Annonce;
import CarNova.carnova.Repository.AnnonceRepository;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/assistant")
@CrossOrigin
public class AssistantController {

    private static final Logger log = LoggerFactory.getLogger(AssistantController.class);

    private final AnnonceRepository annonceRepository;
    private final RestClient http;

    @Value("${ai.provider:openai}") private String provider;                // "openai" ou "ollama"
    @Value("${openai.api.key:}") private String openaiKey;
    @Value("${ai.openai.model:gpt-4o-mini}") private String openaiModel;

    @Value("${ai.ollama.url:http://localhost:11434}") private String ollamaUrl;
    @Value("${ai.ollama.model:phi3:mini-4k-instruct}") private String ollamaModel;

    @Value("${ai.fallbackToOllama:true}") private boolean fallbackToOllama;

    public AssistantController(AnnonceRepository annonceRepository) {
        this.annonceRepository = annonceRepository;
        this.http = RestClient.builder().build();
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest req) {
        Map<String, Object> ctx = new LinkedHashMap<>();

        // Contexte annonce (optionnel)
        if (req.getAnnonceId() != null) {
            annonceRepository.findById(req.getAnnonceId()).ifPresent(a -> {
                ctx.put("annonce.id", a.getId());
                ctx.put("annonce.titre", safe(a.getTitre()));
                ctx.put("annonce.description", truncate(safe(a.getDescription()), 600)); // évite trop de tokens
                ctx.put("annonce.type", a.getTypeAnnonce() != null ? a.getTypeAnnonce().name() : null);
            });
        }
        // Contexte front (tronqué)
        if (req.getContext() != null) {
            req.getContext().forEach((k, v) -> {
                if (v instanceof String s) ctx.put(k, truncate(s, 400));
                else ctx.put(k, v);
            });
        }

        // Stat simple
        String titre = String.valueOf(ctx.getOrDefault("annonce.titre", ""));
        int similairesCount = 0;
        if (titre != null && titre.trim().length() > 2) {
            similairesCount = (int) annonceRepository.findAll().stream()
                    .filter(x -> x.getTitre() != null && x.getTitre().toLowerCase().contains(titre.toLowerCase()))
                    .count();
        }

        String systemPrompt = """
                Tu es CarNova Assistant, expert automobile.
                - Réponds en français, clairement, avec des puces utiles et concises.
                - Utilise le contexte (modèle, prix, km, localisation si disponibles).
                - Donne des conseils achat/vente, négociation (fourchette), démarches (documents, coûts estimatifs).
                - Si une info manque, signale-le et propose comment l'obtenir.
                - Conclus par 2–3 suggestions de questions pertinentes.
                - Ton neutre et professionnel, pas d'avis légal.
                """;

        String contextBlock = "Contexte:\n" + pretty(ctx) +
                "\nStats:\n- Annonces au titre similaire: " + similairesCount +
                "\nDate: " + LocalDate.now();

        String userPrompt = "Question: " + safe(req.getMessage()) + "\n\n" + contextBlock;

        String answer;
        try {
            String effectiveProvider = resolveProvider();
            log.info("[Assistant] Using provider={} | openaiModel={} | ollamaUrl={} | ollamaModel={}",
                    effectiveProvider, openaiModel, ollamaUrl, ollamaModel);

            if ("openai".equalsIgnoreCase(effectiveProvider)) {
                try {
                    answer = callOpenAI(userPrompt, systemPrompt);
                } catch (Exception e) {
                    String msg = safe(e.getMessage()).toLowerCase();
                    boolean quota = msg.contains("429") || msg.contains("too many requests") ||
                            msg.contains("insufficient_quota") || msg.contains("exceeded your current quota");
                    if (fallbackToOllama && quota) {
                        log.warn("[Assistant] OpenAI quota/429 -> fallback Ollama");
                        answer = callOllama(userPrompt, systemPrompt);
                    } else {
                        throw e;
                    }
                }
            } else {
                answer = callOllama(userPrompt, systemPrompt);
            }
        } catch (Exception e) {
            log.error("[Assistant] Erreur IA: {}", e.toString(), e);
            answer = "Erreur IA: " + e.getClass().getSimpleName() + " - " + safe(e.getMessage()) +
                    " | Vérifie la config (provider, clé ou modèle) et la connectivité.";
        }

        List<Suggestion> followUps = List.of(
                new Suggestion("Peux-tu me donner une estimation de prix réaliste ?"),
                new Suggestion("Quels documents dois-je vérifier avant d’acheter ?"),
                new Suggestion("Comment négocier ce prix efficacement ?")
        );

        ChatResponse res = new ChatResponse();
        res.setAnswer(answer);
        res.setFollowUps(followUps);
        return ResponseEntity.ok(res);
    }

    private String resolveProvider() {
        if ("openai".equalsIgnoreCase(provider)) {
            if (openaiKey == null || openaiKey.isBlank())
                throw new IllegalStateException("OPENAI_API_KEY manquant (application.properties)");
            return "openai";
        }
        return "ollama";
    }

    private String callOpenAI(String userPrompt, String systemPrompt) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("model", openaiModel);
        payload.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        ));
        payload.put("temperature", 0.2);
        payload.put("max_tokens", 300); // rapide et économique

        Map resp = http.post()
                .uri("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + openaiKey)
                .header("Content-Type", "application/json")
                .body(payload)
                .retrieve()
                .body(Map.class);

        try {
            List choices = (List) resp.get("choices");
            Map first = (Map) choices.get(0);
            Map msg = (Map) first.get("message");
            return (String) msg.get("content");
        } catch (Exception e) {
            throw e;
        }
    }

    private String callOllama(String userPrompt, String systemPrompt) {
        Map<String, Object> options = new HashMap<>();
        options.put("num_ctx", 1024);                                        // contexte modéré (moins de tokens)
        options.put("num_predict", 160);                                      // réponses courtes => très rapide
        options.put("temperature", 0.2);
        options.put("top_p", 0.9);
        options.put("repeat_penalty", 1.1);
        options.put("num_thread", Runtime.getRuntime().availableProcessors()); // tous les cœurs CPU
        options.put("num_gpu", -1);                                           // -1 = offload max GPU si dispo (NVIDIA/Metal)

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", ollamaModel);
        payload.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        ));
        payload.put("options", options);
        payload.put("stream", false);        // passe à true si tu implémentes le streaming côté front
        payload.put("keep_alive", "30m");    // garde le modèle en RAM (très important pour la réactivité)

        Map resp = http.post()
                .uri(ollamaUrl + "/api/chat")
                .header("Content-Type", "application/json")
                .body(payload)
                .retrieve()
                .body(Map.class);

        Map msg = (Map) resp.get("message");
        return (String) msg.get("content");
    }

    private String pretty(Map<String, Object> ctx) {
        return ctx.entrySet().stream()
                .map(e -> "- " + e.getKey() + ": " + String.valueOf(e.getValue()))
                .collect(Collectors.joining("\n"));
    }

    private String safe(String s) { return s == null ? "" : s; }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max) + "…" : s;
    }

    @Data
    public static class ChatRequest {
        private String message;
        private Long annonceId;
        private Map<String, Object> context;
        private String locale;
    }
    @Data
    public static class ChatResponse {
        private String answer;
        private List<Suggestion> followUps;
    }
    @Data
    public static class Suggestion {
        public Suggestion() {}
        public Suggestion(String text) { this.text = text; }
        private String text;
    }
}
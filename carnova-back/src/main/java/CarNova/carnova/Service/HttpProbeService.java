package CarNova.carnova.Service;

import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@Service
public class HttpProbeService {

    public ProbeResult probe(String urlStr, int maxBytes) {
        try {
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36");
            conn.setRequestProperty("Accept", "*/*");
            int code = conn.getResponseCode();
            String ct = conn.getContentType();
            String body = "";
            if (code >= 200 && code < 300) {
                try (InputStream is = conn.getInputStream()) {
                    byte[] buf = is.readNBytes(Math.max(0, maxBytes));
                    body = new String(buf, StandardCharsets.UTF_8);
                }
            }
            return new ProbeResult(urlStr, code, ct, body, null);
        } catch (Exception ex) {
            return new ProbeResult(urlStr, -1, null, null, ex.toString());
        }
    }

    public record ProbeResult(String url, int status, String contentType, String head, String error) {}
}

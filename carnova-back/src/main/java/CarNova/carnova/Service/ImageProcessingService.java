package CarNova.carnova.Service;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;

@Service
public class ImageProcessingService {

    public byte[] removeBackground(byte[] imageBytes) throws IOException, InterruptedException {
        Path input = Files.createTempFile("input", ".jpg");
        Path output = Files.createTempFile("output", ".png");
        Files.write(input, imageBytes);

        System.out.println("Input file: " + input.toAbsolutePath());
        System.out.println("Output file: " + output.toAbsolutePath());

        // Chemin complet vers Python
        ProcessBuilder pb = new ProcessBuilder(
                "C:\\Users\\Wassim hajji\\AppData\\Local\\Programs\\Python\\Python313\\Scripts\\rembg.exe",
                "i", input.toString(), output.toString()
        );

        // Capture stdout et stderr
        pb.redirectErrorStream(true);
        Process process = pb.start();

        // Lire la sortie du processus
        StringBuilder outputLog = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                outputLog.append(line).append("\n");
            }
        }

        int exitCode = process.waitFor();
        System.out.println("Exit code: " + exitCode);
        System.out.println("Rembg output:\n" + outputLog);

        if (!Files.exists(output) || Files.size(output) == 0) {
            throw new IOException("Rembg échoué. Logs:\n" + outputLog);
        }

        byte[] result = Files.readAllBytes(output);

        Files.deleteIfExists(input);
        Files.deleteIfExists(output);

        return result;
    }
}
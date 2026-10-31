package CarNova.carnova;

import static org.assertj.core.api.Assertions.*;

import CarNova.carnova.service.FileStorage;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class FileStorageTests {
  @TempDir Path root;

  private FileStorage storage() throws Exception {
    return new FileStorage(root.resolve("uploads").toString(), root.resolve("models").toString());
  }

  private MockMultipartFile model(String json) {
    byte[] content = json.getBytes(java.nio.charset.StandardCharsets.UTF_8);
    int padded = (content.length + 3) / 4 * 4;
    var buffer = ByteBuffer.allocate(20 + padded).order(ByteOrder.LITTLE_ENDIAN);
    buffer
        .putInt(0x46546c67)
        .putInt(2)
        .putInt(20 + padded)
        .putInt(padded)
        .putInt(0x4e4f534a)
        .put(content);
    while (buffer.hasRemaining()) buffer.put((byte) ' ');
    return new MockMultipartFile(
        "glb", "../../unsafe.glb", "application/octet-stream", buffer.array());
  }

  @Test
  void imageIsDecodedAndStoredWithGeneratedConfinedName() throws Exception {
    var files = storage();
    var output = new ByteArrayOutputStream();
    ImageIO.write(new BufferedImage(160, 120, BufferedImage.TYPE_INT_RGB), "png", output);
    String url =
        files.image(
            new MockMultipartFile(
                "image", "../../user-name.png", "image/png", output.toByteArray()));
    assertThat(url).matches("/uploads/[a-f0-9-]+\\.(jpg|png)");
    var path = files.resolve(url.substring("/uploads/".length()), false);
    assertThat(ImageIO.read(path.toFile()).getWidth()).isEqualTo(160);
  }

  @Test
  void fakeImagesAndGlbMagicAreRejected() throws Exception {
    var files = storage();
    assertThatThrownBy(() ->
            files.image(
                new MockMultipartFile(
                    "image", "fake.png", "image/png", "<script>bad</script>".getBytes())))
        .isInstanceOf(ResponseStatusException.class);
    assertThatThrownBy(() ->
            files.model(
                new MockMultipartFile("glb", "fake.glb", "model/gltf-binary", new byte[20])))
        .isInstanceOf(ResponseStatusException.class);
  }

  @Test
  void validGlbIsAcceptedButExternalResourcesAreRejected() throws Exception {
    var files = storage();
    String url = files.model(model("{\"asset\":{\"version\":\"2.0\"}}"));
    assertThat(files.resolve(url.substring("/api/models/".length()), true)).exists();
    assertThatThrownBy(() ->
            files.model(
                model(
                    "{\"asset\":{\"version\":\"2.0\"},\"images\":[{\"uri\":\"http://127.0.0.1/private\"}]}")))
        .isInstanceOf(ResponseStatusException.class);
  }

  @Test
  void traversalAndSymlinkEscapesAreRejected() throws Exception {
    var files = storage();
    assertThatThrownBy(() -> files.resolve("../private.png", false))
        .isInstanceOf(ResponseStatusException.class);
    var outside = root.resolve("private.png");
    Files.write(outside, new byte[] {1, 2});
    Files.createSymbolicLink(root.resolve("uploads/link.png"), outside);
    assertThatThrownBy(() -> files.resolve("link.png", false))
        .isInstanceOf(ResponseStatusException.class);
  }

  @Test
  void largePhotosAreResizedAndReencodedForMarketplaceDisplay() throws Exception {
    var files = storage();
    var bytes = new ByteArrayOutputStream();
    ImageIO.write(new BufferedImage(3000, 1500, BufferedImage.TYPE_INT_RGB), "png", bytes);
    String url =
        files.image(new MockMultipartFile("image", "large.png", "image/png", bytes.toByteArray()));
    var path = files.resolve(url.substring("/uploads/".length()), false);
    var image = ImageIO.read(path.toFile());
    assertThat(image.getWidth()).isEqualTo(1920);
    assertThat(image.getHeight()).isEqualTo(960);
    assertThat(url).endsWith(".jpg");
  }
}

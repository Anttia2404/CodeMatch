package vn.codematch.cvs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Component
public class FileSystemPrivateCvStorage implements PrivateCvStorage {
    private final Path root;

    public FileSystemPrivateCvStorage(@Value("${codematch.cv.storage-dir}") String storageDirectory) {
        this.root = Path.of(storageDirectory).toAbsolutePath().normalize();
    }

    @Override
    public UUID store(byte[] content) throws IOException {
        Files.createDirectories(root);
        UUID storageKey = UUID.randomUUID();
        Path temporary = Files.createTempFile(root, ".incoming-", ".tmp");
        try {
            Files.write(temporary, content);
            Path destination = resolve(storageKey);
            try {
                Files.move(temporary, destination, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException exception) {
                Files.move(temporary, destination);
            }
            return storageKey;
        } finally {
            Files.deleteIfExists(temporary);
        }
    }

    @Override
    public byte[] read(UUID storageKey) throws IOException {
        Path path = resolve(storageKey);
        if (!Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)) {
            throw new IOException("Private CV object is unavailable.");
        }
        return Files.readAllBytes(path);
    }

    @Override
    public void delete(UUID storageKey) throws IOException {
        Files.deleteIfExists(resolve(storageKey));
    }

    private Path resolve(UUID storageKey) throws IOException {
        Path path = root.resolve(storageKey + ".pdf").normalize();
        if (!path.startsWith(root) || path.equals(root)) {
            throw new IOException("Invalid private CV storage key.");
        }
        return path;
    }
}

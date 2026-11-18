package vn.codematch.cvs;

import java.io.IOException;
import java.util.UUID;

public interface PrivateCvStorage {
    UUID store(byte[] content) throws IOException;
    byte[] read(UUID storageKey) throws IOException;
    void delete(UUID storageKey) throws IOException;
}

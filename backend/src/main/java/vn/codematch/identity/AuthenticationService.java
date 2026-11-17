package vn.codematch.identity;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codematch.api.ApiException;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthenticationService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AuthenticationService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String password = request.password();
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw ApiException.badRequest("Mật khẩu không được dài quá 72 byte UTF-8.");
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw duplicateEmail();
        }
        User user = new User(UUID.randomUUID(), email, passwordEncoder.encode(password),
            request.displayName().trim(), AccountStatus.ACTIVE);
        try {
            return UserResponse.from(users.saveAndFlush(user));
        } catch (DataIntegrityViolationException exception) {
            throw duplicateEmail();
        }
    }

    @Transactional(readOnly = true)
    public UserResponse current(AccountPrincipal principal) {
        return users.findById(principal.id()).map(UserResponse::from).orElseThrow(ApiException::notFound);
    }

    private static ApiException duplicateEmail() {
        return ApiException.conflict("email_unavailable", "Email này đã được đăng ký.");
    }
}

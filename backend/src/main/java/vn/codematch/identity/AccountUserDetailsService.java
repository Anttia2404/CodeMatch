package vn.codematch.identity;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountUserDetailsService implements UserDetailsService {
    private final UserRepository users;

    public AccountUserDetailsService(UserRepository users) {
        this.users = users;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) {
        User user = users.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new UsernameNotFoundException("Account not found"));
        return new AccountPrincipal(user.getId(), user.getEmail(), user.getDisplayName(), user.getPasswordHash(), user.getAccountStatus(), user.isAdmin());
    }
}

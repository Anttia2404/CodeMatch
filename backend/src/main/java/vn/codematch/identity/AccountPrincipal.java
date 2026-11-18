package vn.codematch.identity;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public record AccountPrincipal(UUID id, String email, String displayName, String password, AccountStatus status, boolean admin)
    implements UserDetails {
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return admin
            ? List.of(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_ADMIN"))
            : List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getUsername() { return email; }

    @Override
    public String getPassword() { return password; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return status != AccountStatus.SUSPENDED; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return status == AccountStatus.ACTIVE; }

    @Override
    public String toString() {
        return "AccountPrincipal[id=" + id + ", email=" + email + ", status=" + status + "]";
    }
}

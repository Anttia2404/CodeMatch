package vn.codematch.foundation;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SecurityConfigurationTest.ProbeController.class)
@Import(SecurityConfiguration.class)
class SecurityConfigurationTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserDetailsService users;

    @MockitoBean
    private RateLimitService rateLimits;

    @MockitoBean
    private PilotMetrics pilotMetrics;

    @Test
    void deniesUnimplementedApiRoutesByDefault() throws Exception {
        mockMvc.perform(get("/api/v1/probe")).andExpect(status().isUnauthorized());
    }

    @Test
    void allowsConfiguredFrontendOriginOnApiPreflight() throws Exception {
        mockMvc.perform(options("/api/v1/probe")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @RestController
    static class ProbeController {
        @GetMapping("/api/v1/probe")
        String probe() {
            return "ok";
        }
    }
}

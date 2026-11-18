package vn.codematch.requests;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codematch.api.ApiException;
import vn.codematch.identity.User;
import vn.codematch.identity.UserRepository;
import vn.codematch.foundation.PilotMetrics;
import vn.codematch.profiles.Skill;
import vn.codematch.profiles.SkillRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class LearningRequestService {
    private final LearningRequestRepository requests;
    private final SkillRepository skills;
    private final UserRepository users;
    private final SavedRequestRepository savedRequests;
    private final PilotMetrics metrics;

    public LearningRequestService(LearningRequestRepository requests, SkillRepository skills,
            UserRepository users, SavedRequestRepository savedRequests, PilotMetrics metrics) {
        this.requests = requests;
        this.skills = skills;
        this.users = users;
        this.savedRequests = savedRequests;
        this.metrics = metrics;
    }

    @Transactional
    public LearningRequestResponse create(String email, LearningRequestCommand command) {
        validate(command);
        User learner = owner(email);
        return LearningRequestResponse.from(requests.save(
            new LearningRequest(UUID.randomUUID(), learner, command, resolveSkills(command.skillIds()))));
    }

    @Transactional
    public LearningRequestResponse update(String email, UUID id, LearningRequestCommand command) {
        validate(command);
        LearningRequest request = requests.findLockedWithSkillsById(id).orElseThrow(ApiException::notFound);
        if (!owns(email, request)) throw ApiException.notFound();
        if (request.getStatus() == LearningRequestStatus.CLOSED || request.getStatus() == LearningRequestStatus.MATCHED) {
            throw ApiException.conflict("request_closed", "Yêu cầu đã đóng hoặc đã chọn developer nên không thể chỉnh sửa.");
        }
        request.updateDetails(command, resolveSkills(command.skillIds()));
        return LearningRequestResponse.from(request);
    }

    @Transactional
    public LearningRequestResponse publish(String email, UUID id) {
        LearningRequest request = ownedRequest(email, id);
        if (request.getStatus() != LearningRequestStatus.DRAFT) {
            throw ApiException.conflict("invalid_transition", "Chỉ có thể đăng yêu cầu đang ở trạng thái nháp.");
        }
        request.publish();
        metrics.record("learning_request.published");
        return LearningRequestResponse.from(request);
    }

    @Transactional
    public LearningRequestResponse close(String email, UUID id) {
        LearningRequest request = ownedRequest(email, id);
        if (request.getStatus() != LearningRequestStatus.OPEN) {
            throw ApiException.conflict("invalid_transition", "Chỉ có thể đóng yêu cầu đang mở.");
        }
        request.close();
        return LearningRequestResponse.from(request);
    }

    @Transactional(readOnly = true)
    public PageResponse<LearningRequestResponse> discover(String keyword, List<UUID> skillIds,
            LearningLevel level, LearningFormat format, Long minBudget, Long maxBudget,
            BudgetUnit unit, Boolean requiresCv, int page, int size, String sort) {
        validatePage(page, size, sort);
        if (minBudget != null && minBudget < 0 || maxBudget != null && maxBudget < 0) {
            throw ApiException.badRequest("Ngân sách lọc phải bằng hoặc lớn hơn 0.");
        }
        if (minBudget != null && maxBudget != null && minBudget > maxBudget) {
            throw ApiException.badRequest("Ngân sách thấp nhất không được lớn hơn ngân sách cao nhất.");
        }
        if ((minBudget != null || maxBudget != null) && unit == null) {
            throw ApiException.badRequest("Chọn đơn vị ngân sách khi lọc theo khoảng giá.");
        }
        if (keyword != null && keyword.length() > 120) throw ApiException.badRequest("Từ khóa tìm kiếm không được dài quá 120 ký tự.");
        if (skillIds != null && skillIds.size() > 10) throw ApiException.badRequest("Chọn tối đa 10 kỹ năng để lọc.");
        Sort order = "OLDEST".equals(sort) ? Sort.by(Sort.Direction.ASC, "publishedAt")
            : Sort.by(Sort.Direction.DESC, "publishedAt");
        Page<LearningRequestResponse> results = requests.findAll(
            LearningRequestSpecifications.discovery(keyword, skillIds, level, format, minBudget, maxBudget, unit, requiresCv),
            PageRequest.of(page, size, order)).map(LearningRequestResponse::from);
        return PageResponse.from(results);
    }

    @Transactional(readOnly = true)
    public LearningRequestResponse get(String email, UUID id, boolean admin) {
        LearningRequest request = requests.findWithSkillsById(id).orElseThrow(ApiException::notFound);
        if ((request.getStatus() != LearningRequestStatus.OPEN || request.getHiddenAt() != null)
                && !owns(email, request) && !admin) {
            throw ApiException.notFound();
        }
        return LearningRequestResponse.from(request);
    }

    @Transactional(readOnly = true)
    public PageResponse<LearningRequestResponse> mine(String email, LearningRequestStatus status, int page, int size) {
        validatePage(page, size, "NEWEST");
        User user = owner(email);
        if (status == null) {
            return PageResponse.from(requests.findAllByLearnerId(user.getId(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt")))
                .map(LearningRequestResponse::from));
        }
        return PageResponse.from(requests.findAllByLearnerIdAndStatus(user.getId(), status,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt")))
            .map(LearningRequestResponse::from));
    }

    @Transactional
    public void save(String email, UUID requestId) {
        User user = owner(email);
        LearningRequest request = requests.findWithSkillsById(requestId).orElseThrow(ApiException::notFound);
        if (request.getStatus() != LearningRequestStatus.OPEN || request.getHiddenAt() != null) {
            throw ApiException.conflict("request_not_open", "Chỉ có thể lưu yêu cầu đang mở.");
        }
        if (!savedRequests.existsByUserIdAndLearningRequestId(user.getId(), requestId)) {
            savedRequests.save(new SavedRequest(user, request));
        }
    }

    @Transactional
    public void unsave(String email, UUID requestId) {
        User user = owner(email);
        savedRequests.deleteByUserIdAndLearningRequestId(user.getId(), requestId);
    }

    @Transactional(readOnly = true)
    public List<LearningRequestResponse> saved(String email) {
        User user = owner(email);
        return savedRequests.findAllByUserIdAndLearningRequestHiddenAtIsNullOrderByCreatedAtDesc(user.getId()).stream()
            .map(SavedRequest::getLearningRequest).map(LearningRequestResponse::from).toList();
    }

    private void validate(LearningRequestCommand command) {
        boolean anyBudget = command.budgetMin() != null || command.budgetMax() != null || command.budgetUnit() != null;
        boolean completeBudget = command.budgetMin() != null && command.budgetMax() != null && command.budgetUnit() != null;
        if (anyBudget && !completeBudget) throw ApiException.badRequest("Cần nhập đủ mức ngân sách tối thiểu, tối đa và đơn vị.");
        if (command.budgetMin() != null && command.budgetMin() > command.budgetMax()) {
            throw ApiException.badRequest("Ngân sách tối thiểu không được lớn hơn tối đa.");
        }
        if (command.preferredFormat() == LearningFormat.OFFLINE && (command.city() == null || command.city().isBlank())) {
            throw ApiException.badRequest("Yêu cầu học trực tiếp cần có thành phố.");
        }
        if (command.skillIds() == null || command.skillIds().isEmpty()) throw ApiException.badRequest("Chọn ít nhất một kỹ năng.");
    }

    private Set<Skill> resolveSkills(List<UUID> ids) {
        Set<UUID> uniqueIds = new HashSet<>(ids);
        if (uniqueIds.size() != ids.size()) throw ApiException.badRequest("Không chọn lặp lại cùng một kỹ năng.");
        List<Skill> found = skills.findAllById(uniqueIds);
        if (found.size() != uniqueIds.size()) throw ApiException.badRequest("Có kỹ năng không nằm trong danh mục hiện có.");
        return new HashSet<>(found);
    }

    private LearningRequest ownedRequest(String email, UUID id) {
        LearningRequest request = requests.findWithSkillsById(id).orElseThrow(ApiException::notFound);
        if (!owns(email, request)) throw ApiException.notFound();
        return request;
    }

    private boolean owns(String email, LearningRequest request) {
        return email != null && request.getLearner().getEmail().equalsIgnoreCase(email);
    }

    private User owner(String email) { return users.findByEmailIgnoreCase(email).orElseThrow(ApiException::notFound); }

    private void validatePage(int page, int size, String sort) {
        if (page < 0 || size < 1 || size > 50) throw ApiException.badRequest("Trang phải từ 0 trở lên và kích thước trang từ 1 đến 50.");
        if (!"NEWEST".equals(sort) && !"OLDEST".equals(sort)) throw ApiException.badRequest("Thứ tự sắp xếp không hợp lệ.");
    }
}

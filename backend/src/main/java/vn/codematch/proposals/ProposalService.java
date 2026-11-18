package vn.codematch.proposals;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codematch.api.ApiException;
import vn.codematch.cvs.CvDownload;
import vn.codematch.cvs.CvService;
import vn.codematch.cvs.DeveloperCv;
import vn.codematch.profiles.DeveloperProfile;
import vn.codematch.profiles.DeveloperProfileRepository;
import vn.codematch.requests.LearningRequest;
import vn.codematch.requests.LearningRequestRepository;
import vn.codematch.requests.LearningRequestStatus;

import java.util.List;
import java.util.UUID;

@Service
public class ProposalService {
    private final TeachingProposalRepository proposals;
    private final LearningRequestRepository requests;
    private final DeveloperProfileRepository profiles;
    private final CvService cvs;

    public ProposalService(TeachingProposalRepository proposals, LearningRequestRepository requests,
                           DeveloperProfileRepository profiles, CvService cvs) {
        this.proposals = proposals;
        this.requests = requests;
        this.profiles = profiles;
        this.cvs = cvs;
    }

    @Transactional
    public ProposalResponse submit(String email, UUID requestId, ProposalCommand command) {
        if (command.removeCv()) throw ApiException.badRequest("Không thể xóa CV khi tạo đề xuất.");
        DeveloperProfile developer = profile(email);
        LearningRequest request = requests.findLockedById(requestId).orElseThrow(ApiException::notFound);
        if (request.getStatus() != LearningRequestStatus.OPEN) {
            throw ApiException.conflict("request_not_open", "Yêu cầu này không nhận đề xuất mới.");
        }
        if (request.getLearner().getId().equals(developer.getOwner().getId())) {
            throw ApiException.conflict("self_application", "Bạn không thể gửi đề xuất cho yêu cầu của mình.");
        }
        if (proposals.existsByLearningRequestIdAndDeveloperProfileIdAndStatus(requestId, developer.getId(), ProposalStatus.SUBMITTED)) {
            throw duplicateProposal();
        }
        DeveloperCv cv = cvs.resolveForProposal(email, developer, command.cvId());
        requireCvWhenNeeded(request, cv);
        try {
            TeachingProposal created = proposals.saveAndFlush(
                new TeachingProposal(UUID.randomUUID(), request, developer, cv, command));
            return ProposalResponse.from(created);
        } catch (DataIntegrityViolationException exception) {
            throw duplicateProposal();
        }
    }

    @Transactional
    public ProposalResponse update(String email, UUID id, ProposalCommand command) {
        if (command.cvId() != null && command.removeCv()) {
            throw ApiException.badRequest("Chọn một CV mới hoặc xóa CV đính kèm, không thể làm cả hai.");
        }
        TeachingProposal proposal = proposals.findLockedById(id).orElseThrow(ApiException::notFound);
        requireProposalOwner(email, proposal);
        requireRequestNotMatched(proposal);
        if (proposal.getStatus() != ProposalStatus.SUBMITTED) {
            throw ApiException.conflict("proposal_not_editable", "Chỉ có thể sửa đề xuất đang gửi.");
        }
        DeveloperCv replacementCv = proposal.getCv();
        boolean replaceCv = command.cvId() != null || command.removeCv();
        if (command.cvId() != null) replacementCv = cvs.resolveForProposal(email, proposal.getDeveloperProfile(), command.cvId());
        if (command.removeCv()) replacementCv = null;
        requireCvWhenNeeded(proposal.getLearningRequest(), replacementCv);
        proposal.update(command, replacementCv, replaceCv);
        return ProposalResponse.from(proposal);
    }

    @Transactional
    public ProposalResponse withdraw(String email, UUID id) {
        TeachingProposal proposal = proposals.findLockedById(id).orElseThrow(ApiException::notFound);
        requireProposalOwner(email, proposal);
        requireRequestNotMatched(proposal);
        if (proposal.getStatus() != ProposalStatus.SUBMITTED) {
            throw ApiException.conflict("proposal_already_withdrawn", "Đề xuất này đã được rút.");
        }
        proposal.withdraw();
        return ProposalResponse.from(proposal);
    }

    @Transactional(readOnly = true)
    public List<ProposalResponse> mine(String email) {
        DeveloperProfile developer = profile(email);
        return proposals.findAllByDeveloperProfileIdOrderByUpdatedAtDesc(developer.getId()).stream()
            .map(ProposalResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ProposalResponse> received(String email, UUID requestId) {
        LearningRequest request = requests.findWithSkillsById(requestId).orElseThrow(ApiException::notFound);
        if (!owns(email, request)) throw ApiException.notFound();
        return proposals.findAllByLearningRequestIdOrderByCreatedAtDesc(requestId).stream()
            .map(ProposalResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ProposalResponse get(String email, UUID id) {
        TeachingProposal proposal = detail(id);
        if (!isProposalOwner(email, proposal) && !owns(email, proposal.getLearningRequest())) throw ApiException.notFound();
        return ProposalResponse.from(proposal);
    }

    @Transactional(readOnly = true)
    public CvDownload downloadCv(String email, UUID id) {
        TeachingProposal proposal = detail(id);
        if (!isProposalOwner(email, proposal) && !owns(email, proposal.getLearningRequest())) throw ApiException.notFound();
        if (proposal.getCv() == null) throw ApiException.notFound();
        return cvs.downloadAttached(proposal.getCv());
    }

    private TeachingProposal detail(UUID id) {
        return proposals.findWithDetailsById(id).orElseThrow(ApiException::notFound);
    }

    private DeveloperProfile profile(String email) {
        return profiles.findWithOwnerAndSkillsByOwnerEmailIgnoreCase(email)
            .orElseThrow(() -> ApiException.conflict("developer_profile_required", "Tạo hồ sơ developer trước khi gửi đề xuất."));
    }

    private void requireCvWhenNeeded(LearningRequest request, DeveloperCv cv) {
        if (request.isRequiresCv() && cv == null) {
            throw ApiException.badRequest("Yêu cầu này cần CV. Hãy tải CV lên và đính kèm trước khi gửi.");
        }
    }

    private void requireRequestNotMatched(TeachingProposal proposal) {
        if (proposal.getLearningRequest().getStatus() == LearningRequestStatus.MATCHED) {
            throw ApiException.conflict("proposal_locked_after_match", "Đề xuất không thể thay đổi sau khi người học đã chọn developer.");
        }
    }

    private void requireProposalOwner(String email, TeachingProposal proposal) {
        if (!isProposalOwner(email, proposal)) throw ApiException.notFound();
    }

    private boolean isProposalOwner(String email, TeachingProposal proposal) {
        return proposal.getDeveloperProfile().getOwner().getEmail().equalsIgnoreCase(email);
    }

    private boolean owns(String email, LearningRequest request) {
        return request.getLearner().getEmail().equalsIgnoreCase(email);
    }

    private ApiException duplicateProposal() {
        return ApiException.conflict("active_proposal_exists", "Bạn đã có đề xuất đang gửi cho yêu cầu này.");
    }
}

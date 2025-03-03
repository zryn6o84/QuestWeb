// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract QuestWeb is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    using ECDSA for bytes32;
    using Strings for uint256;

    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");

    // Structure to represent a task
    struct Task {
        uint256 id;         // ID of the task
        string name;        // Name of the task
        address creator;    // Address of the task creator
        string description; // Description of the task
        uint256 deadline;   // Unix timestamp for the task deadline (0 for no deadline)
        uint256 maxCompletions; // Maximum number of completions allowed
        uint256 numCompletions; // Current number of completions
        address[] reviewers; // Array of reviewer addresses
        bool completed;     // Flag to indicate if the task is completed
        uint256 rewardAmount; // Amount of reward tokens offered for the task
        uint256 createdAt;  // Timestamp of task creation
        bool cancelled;     // Flag to indicate if the task is cancelled
        string config;      // Configuration string for the task
        bool allowSelfCheck;     // Whether self-check is allowed
    }

    // Structure to represent a QuestWeb
    struct Board {
        uint256 id;         // ID of the board
        address creator;    // Address of the QuestWeb creator
        string name;        // Name of the QuestWeb
        string description; // Description of the QuestWeb
        string img;         // URL or IPFS hash of the board's image
        Task[] tasks;       // Array of tasks associated with the board
        IERC20 rewardToken; // ERC20 token used for rewards
        uint256 totalPledged; // Total amount of reward tokens pledged
        address[] members;  // Array of board members
        uint256 createdAt;  // Timestamp of board creation
        bool closed;        // Flag to indicate if the board is closed
        string config;        // Add new field
    }

    // Mapping from QuestWeb ID to QuestWeb details
    mapping(uint256 => Board) public boards;
    uint256 public boardCount; // Counter for QuestWeb IDs

    // Structure to represent a submission for a bounty
    struct Submission {
        address submitter; // Address of the user who submitted the task
        string proof; // Proof of completion (e.g., link to a GitHub repo, document, etc.)
        int8 status; // Review status: -1 = rejected, 0 = pending, 1 = approved
        uint256 submittedAt; // Timestamp of submission
        string reviewComment; // Review comment
    }

    // Mapping from bounty ID to an array of submissions
    mapping(uint256 => mapping(uint256 => mapping(address => Submission)))
        public bountySubmissions;

    // Event emitted when a new QuestWeb is created
    event QuestWebCreated(
        uint256 indexed questId,
        address indexed creator,
        string name,
        string description,
        address rewardToken,
        uint256 createdAt,
        string config      // Add new field
    );

    // Event emitted when tokens are pledged to a QuestWeb
    event TokensPledged(
        uint256 indexed questId,
        address indexed pledger,
        uint256 amount
    );

    // Event emitted when bounty details are updated
    event BountyUpdated(
        uint256 indexed questId,
        uint256 indexed bountyId,
        string description,
        uint256 deadline,
        uint256 maxCompletions,
        uint256 rewardAmount
    );

    event TaskCreated(
        uint256 indexed questId,
        uint256 indexed taskId,
        address creator,
        string name,
        string description,
        uint256 deadline,
        uint256 maxCompletions,
        uint256 rewardAmount,
        uint256 createdAt
    );

    event TaskUpdated(
        uint256 indexed questId,
        uint256 indexed taskId,
        string name,
        string description,
        uint256 deadline,
        uint256 maxCompletions,
        uint256 rewardAmount,
        string config,
        bool allowSelfCheck
    );

    event TaskSucceeded(
        uint256 indexed questId,
        uint256 indexed taskId,
        address submitter,
        uint256 rewardAmount
    );

    event TaskCancelled(uint256 indexed questId, uint256 indexed taskId);

    // Event emitted when a submission is made for a bounty
    event SubmissionMade(
        uint256 indexed questId,
        uint256 indexed bountyId,
        address indexed submitter,
        string proof,
        uint256 submittedAt
    );

    // Event emitted when a submission is reviewed
    event SubmissionReviewed(
        uint256 indexed questId,
        uint256 indexed bountyId,
        address indexed reviewer,
        address submitter,
        int8 status,
        string reviewComment
    );

    // Event emitted when a user joins a board
    event UserJoinedBoard(uint256 indexed questId, address indexed user);

    // Event emitted when a reviewer is added to a bounty
    event ReviewerAdded(
        uint256 indexed questId,
        uint256 indexed bountyId,
        address reviewer
    );

    // Event emitted when a bounty is cancelled
    event BountyCancelled(uint256 indexed questId, uint256 indexed bountyId);

    // Event emitted when a QuestWeb is closed
    event QuestWebClosed(uint256 indexed questId);

    // Event emitted when pledged tokens are withdrawn
    event TokensWithdrawn(
        uint256 indexed questId,
        address indexed withdrawer,
        uint256 amount
    );

    // Event emitted when a QuestWeb is updated
    event QuestWebUpdated(
        uint256 indexed questId,
        string name,
        string description,
        address rewardToken,
        string config      // Add new field
    );

    // Event emmitted when distribution of reward tokens is updated
    event RewardDistributionUpdated(
        uint256 indexed questId,
        uint256 totalPledged
    );

    // Event emitted when the contract is upgraded
    event ContractUpgraded(address indexed oldImplementation, address indexed newImplementation);

    // --- Initialization ---

    address private _implementation;

    // Add signer address
    address public signerAddress;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _signerAddress) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        boardCount = 0;
        signerAddress = _signerAddress;
    }

    // Add necessary UUPS upgrade authorization functions
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newImplementation != address(0), "New implementation cannot be zero address");
        require(newImplementation != address(this), "New implementation cannot be same as current");

        // Get the current implementation address
        address currentImplementation = _implementation;

        // Emit upgrade event
        emit ContractUpgraded(currentImplementation, newImplementation);
    }

    // --- QuestWeb Functions ---

    // Function to create a new QuestWeb
    function createQuestWeb(
        string memory _name,
        string memory _description,
        string memory _img,
        address _rewardToken,
        string memory _config     // Add new parameter
    ) public {
        // Create a new QuestWeb and store it in the `boards` mapping
        Board storage newBoard = boards[boardCount];
        newBoard.id = boardCount;
        newBoard.creator = msg.sender;
        newBoard.name = _name;
        newBoard.description = _description;
        newBoard.img = _img;

        if (_rewardToken == address(0)) {
            newBoard.rewardToken = IERC20(address(0));
        } else {
            newBoard.rewardToken = IERC20(_rewardToken);
        }

        newBoard.totalPledged = 0;
        newBoard.members.push(msg.sender);
        newBoard.createdAt = block.timestamp;
        newBoard.closed = false;
        newBoard.config = _config;    // Add assignment

        _grantRole(REVIEWER_ROLE, msg.sender);

        emit QuestWebCreated(
            boardCount,
            msg.sender,
            _name,
            _description,
            _rewardToken,
            block.timestamp,
            _config      // Add new field
        );

        boardCount++;
    }

    // Function to update QuestWeb details
    function updateQuestWeb(
        uint256 _boardId,
        string memory _name,
        string memory _description,
        string memory _img,
        address _rewardToken,
        string memory _config     // Add new parameter
    ) public {
        Board storage board = boards[_boardId];
        require(
            msg.sender == board.creator,
            "Only the board creator can update the board"
        );

        board.name = _name;
        board.description = _description;
        board.img = _img;
        if (_rewardToken != address(0)) {
            board.rewardToken = IERC20(_rewardToken);
        }
        board.config = _config;    // Add assignment

        emit QuestWebUpdated(_boardId, _name, _description, _rewardToken, _config);
    }

    // Function to create a new bounty within a QuestWeb
    function createTask(
        uint256 _boardId,
        string memory _name,
        string memory _description,
        uint256 _deadline,
        uint256 _maxCompletions,
        uint256 _rewardAmount,
        string memory _config,
        bool _allowSelfCheck      // Keep the allowSelfCheck parameter
    ) public {
        Board storage board = boards[_boardId];
        require(
            board.creator == msg.sender,
            "Only the board creator can create tasks"
        );

        uint256 taskId = board.tasks.length;
        board.tasks.push();
        Task storage newTask = board.tasks[taskId];

        newTask.id = taskId;
        newTask.name = _name;
        newTask.creator = msg.sender;
        newTask.description = _description;
        newTask.deadline = _deadline;
        newTask.maxCompletions = _maxCompletions > 0 ? _maxCompletions : 1;
        newTask.numCompletions = 0;
        newTask.completed = false;
        newTask.rewardAmount = _rewardAmount;
        newTask.createdAt = block.timestamp;
        newTask.cancelled = false;
        newTask.config = _config;
        newTask.reviewers.push(msg.sender);
        newTask.allowSelfCheck = _allowSelfCheck;

        emit TaskCreated(
            _boardId,
            taskId,
            msg.sender,
            _name,
            _description,
            _deadline,
            _maxCompletions,
            _rewardAmount,
            block.timestamp
        );
    }

    // Function to pledge tokens to a QuestWeb
    function pledgeTokens(uint256 _boardId, uint256 _amount) public payable {
        Board storage board = boards[_boardId];
        require(!board.closed, "Board is closed");
        require(_amount > 0, "Pledge amount must be greater than 0");
        require(board.creator == msg.sender, "Only the board creator can pledge tokens");

        if (board.rewardToken == IERC20(address(0))) {
            require(
                msg.value >= _amount,
                "Sent value does not match the pledge amount"
            );
            board.totalPledged += msg.value;
        } else {
            board.rewardToken.transferFrom(msg.sender, address(this), _amount);
            board.totalPledged += _amount;
        }

        emit TokensPledged(
            _boardId,
            msg.sender,
            board.rewardToken == IERC20(address(0)) ? msg.value : _amount
        );
    }

    // Function to join a QuestWeb
    function joinBoard(uint256 _boardId) public {
        Board storage board = boards[_boardId];
        require(!board.closed, "Board is closed");

        // Check if already a member
        for(uint i = 0; i < board.members.length; i++) {
            require(board.members[i] != msg.sender, "Already a member");
        }

        board.members.push(msg.sender);
        emit UserJoinedBoard(_boardId, msg.sender);
    }

    // Function to update bounty details (only callable by the bounty creator)
    function updateTask(
        uint256 _boardId,
        uint256 _taskId,
        string memory _name,
        string memory _description,
        uint256 _deadline,
        uint256 _maxCompletions,
        uint256 _rewardAmount,
        string memory _config,
        bool _allowSelfCheck
    ) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];
        require(
            msg.sender == task.creator,
            "Only the task creator can update the task"
        );
        require(!task.completed, "Task is already completed");
        require(!task.cancelled, "Task is cancelled");

        task.name = _name;
        task.description = _description;
        task.deadline = _deadline;
        task.maxCompletions = _maxCompletions;
        task.rewardAmount = _rewardAmount;
        task.config = _config;
        task.allowSelfCheck = _allowSelfCheck;

        emit TaskUpdated(
            _boardId,
            _taskId,
            _name,
            _description,
            _deadline,
            _maxCompletions,
            _rewardAmount,
            _config,
            _allowSelfCheck
        );
    }

    // Function to submit proof of completion for a bounty
    function submitProof(
        uint256 _boardId,
        uint256 _taskId,
        string memory _proof
    ) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];
        require(!board.closed, "Board is closed");
        require(!task.completed, "Task is already completed");
        require(!task.cancelled, "Task is cancelled");
        require(
            task.deadline == 0 || task.deadline >= block.timestamp,
            "Task deadline has passed"
        );
        require(
            isBoardMember(_boardId, msg.sender),
            "User is not a member of this board"
        );

        Submission storage submission = bountySubmissions[_boardId][_taskId][
            msg.sender
        ];

        if (submission.submitter == address(0)) {
            // New submission
            submission.submitter = msg.sender;
            submission.proof = _proof;
            submission.status = 0;  // Set initial status to pending
            submission.submittedAt = block.timestamp;
        } else {
            // Update existing submission
            require(
                submission.status != 1,
                "User has already been approved for this task"
            );
            submission.proof = _proof;
            submission.status = 0;  // Reset status to pending
            submission.submittedAt = block.timestamp;
        }

        emit SubmissionMade(
            _boardId,
            _taskId,
            msg.sender,
            _proof,
            block.timestamp
        );
    }

    // Function for reviewers to review a submission
    function reviewSubmission(
        uint256 _boardId,
        uint256 _taskId,
        address _submitter,
        int8 _status,
        string memory _reviewComment
    ) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];
        Submission storage submission = bountySubmissions[_boardId][_taskId][
            _submitter
        ];

        bool isReviewer = false;
        for(uint i = 0; i < task.reviewers.length; i++) {
            if(task.reviewers[i] == msg.sender) {
                isReviewer = true;
                break;
            }
        }
        require(isReviewer, "Caller is not a reviewer for this task");

        require(!task.completed, "Task is already completed");
        require(!task.cancelled, "Task is cancelled");
        require(
            submission.submitter != address(0),
            "No submission found for this user"
        );

        submission.status = _status;
        submission.reviewComment = _reviewComment;

        emit SubmissionReviewed(
            _boardId,
            _taskId,
            msg.sender,
            submission.submitter,
            _status,
            _reviewComment
        );

        if (_status == 1) {
            distributeReward(_boardId, _taskId, submission.submitter);
            task.numCompletions++;

            if (task.numCompletions >= task.maxCompletions) {
                task.completed = true;
                emit TaskSucceeded(
                    _boardId,
                    _taskId,
                    submission.submitter,
                    task.rewardAmount
                );
            }
        }
    }

    // Function to distribute the reward to the participant
    function distributeReward(
        uint256 _boardId,
        uint256 _taskId,
        address _participant
    ) internal {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];

        require(
            board.totalPledged >= task.rewardAmount,
            "Not enough pledged tokens to distribute reward"
        );

        if (board.rewardToken == IERC20(address(0))) {
            payable(_participant).transfer(task.rewardAmount);
        } else {
            board.rewardToken.transfer(_participant, task.rewardAmount);
        }

        board.totalPledged -= task.rewardAmount;

        emit RewardDistributionUpdated(_boardId, board.totalPledged);
    }

    // Function for the board creator to add a reviewer to a specific task
    function addReviewerToTask(
        uint256 _boardId,
        uint256 _taskId,
        address _reviewer
    ) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];
        require(
            msg.sender == task.creator,
            "Only the task creator can add reviewers"
        );

        // Check if the auditor already exists
        for(uint i = 0; i < task.reviewers.length; i++) {
            require(task.reviewers[i] != _reviewer, "Reviewer already exists");
        }

        task.reviewers.push(_reviewer);
        emit ReviewerAdded(_boardId, _taskId, _reviewer);
    }

    // Function for the board creator to cancel a task
    function cancelTask(uint256 _boardId, uint256 _taskId) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];
        require(
            msg.sender == task.creator,
            "Only the task creator can cancel the task"
        );
        require(!task.completed, "Task is already completed");

        task.cancelled = true;
        emit TaskCancelled(_boardId, _taskId);
    }

    // Function for the board creator to close the board
    function closeBoard(uint256 _boardId) public {
        Board storage board = boards[_boardId];
        require(
            msg.sender == board.creator,
            "Only the board creator can close the board"
        );

        board.closed = true;
        emit QuestWebClosed(_boardId);
    }

    // Function for users to withdraw pledged tokens if the board is closed
    function withdrawPledgedTokens(uint256 _boardId) public {
        Board storage board = boards[_boardId];
        require(board.closed, "Board is not closed");
        require(
            msg.sender == board.creator,
            "Only the board creator can withdraw pledged tokens"
        );

        uint256 amount = board.rewardToken == IERC20(address(0))
            ? board.totalPledged
            : 0;

        if (amount > 0) {
            board.totalPledged = 0;
            payable(msg.sender).transfer(amount);
        } else {
            require(
                board.rewardToken.balanceOf(address(this)) >=
                    board.totalPledged,
                "Not enough tokens to withdraw"
            );
            board.rewardToken.transfer(msg.sender, board.totalPledged);
            board.totalPledged = 0;
        }

        emit TokensWithdrawn(_boardId, msg.sender, amount);
    }


    // Add a function to update the signer's address.
    function setSignerAddress(address _newSignerAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newSignerAddress != address(0), "Invalid signer address");
        signerAddress = _newSignerAddress;
    }

    // Modify the selfCheckSubmission function
    function selfCheckSubmission(
        uint256 _boardId,
        uint256 _taskId,
        bytes memory _signature,
        string memory _checkData  // Review comments
    ) public {
        Board storage board = boards[_boardId];
        Task storage task = board.tasks[_taskId];

        require(!board.closed, "Board is closed");
        require(!task.completed, "Task is already completed");
        require(!task.cancelled, "Task is cancelled");
        require(task.allowSelfCheck, "Self-check not allowed for this task");
        require(
            task.deadline == 0 || task.deadline >= block.timestamp,
            "Task deadline has passed"
        );
        require(
            isBoardMember(_boardId, msg.sender),
            "User is not a member of this board"
        );

        // Construct message hash
        bytes32 messageHash = keccak256(abi.encode(
            _boardId,
            _taskId,
            msg.sender,
            _checkData
        ));

        // Convert to Ethereum signed message hash
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);

        // Restore signer address
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, _signature);

        // Verify the signer
        require(signerAddress == recoveredSigner, "Invalid signature");

        // Create or update commit
        Submission storage submission = bountySubmissions[_boardId][_taskId][msg.sender];
        submission.submitter = msg.sender;
        submission.status = 1;
        submission.submittedAt = block.timestamp;
        submission.reviewComment = _checkData;

        // Distribute rewards
        distributeReward(_boardId, _taskId, msg.sender);
        task.numCompletions++;

        if (task.numCompletions >= task.maxCompletions) {
            task.completed = true;
            emit TaskSucceeded(
                _boardId,
                _taskId,
                msg.sender,
                task.rewardAmount
            );
        }

        emit SubmissionReviewed(
            _boardId,
            _taskId,
            recoveredSigner,
            msg.sender,
            1,
            _checkData
        );
    }

    // Define a struct that contains only the data you want to return
    struct BoardView {
        uint256 id;
        address creator;
        string name;
        string description;
        string img;
        uint256 totalPledged;
        uint256 createdAt;
        address rewardToken;
        bool closed;
        string config;        // Add new field
    }

    // Function to get all boards without mappings
    function getAllBoards() public view returns (BoardView[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < boardCount; i++) {
            if (!boards[i].closed) {
                activeCount++;
            }
        }

        BoardView[] memory allBoards = new BoardView[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < boardCount; i++) {
            Board storage board = boards[boardCount - i - 1];
            if (!board.closed) {
                allBoards[currentIndex++] = BoardView(
                    board.id,
                    board.creator,
                    board.name,
                    board.description,
                    board.img,
                    board.totalPledged,
                    board.createdAt,
                    address(board.rewardToken),
                    board.closed,
                    board.config     // Add new field
                );
            }
        }
        return allBoards;
    }

    // Function to check if a user is a member of a board
    function isBoardMember(uint256 _boardId, address _member) public view returns (bool) {
        Board storage board = boards[_boardId];
        for(uint i = 0; i < board.members.length; i++) {
            if(board.members[i] == _member) {
                return true;
            }
        }
        return false;
    }

    // Define a struct for task view
    struct TaskView {
        uint256 id;
        string name;
        address creator;
        string description;
        uint256 deadline;
        uint256 maxCompletions;
        uint256 numCompletions;
        bool completed;
        uint256 rewardAmount;
        uint256 createdAt;
        bool cancelled;
        address[] reviewers;
        string config;
        bool allowSelfCheck;
    }

    // Function to get all tasks for a specific board without mappings
    function getTasksForBoard(uint256 _boardId) public view returns (TaskView[] memory) {
        Board storage board = boards[_boardId];
        uint256 taskCount = board.tasks.length;

        TaskView[] memory tasks = new TaskView[](taskCount);
        for (uint256 i = 0; i < taskCount; i++) {
            Task storage task = board.tasks[i];
            tasks[i] = TaskView({
                id: task.id,
                name: task.name,
                creator: task.creator,
                description: task.description,
                deadline: task.deadline,
                maxCompletions: task.maxCompletions,
                numCompletions: task.numCompletions,
                completed: task.completed,
                rewardAmount: task.rewardAmount,
                createdAt: task.createdAt,
                cancelled: task.cancelled,
                reviewers: task.reviewers,
                config: task.config,
                allowSelfCheck: task.allowSelfCheck
            });
        }
        return tasks;
    }


    // Define a struct for board detail view
    struct BoardDetailView {
        address currentUser;
        uint256 id;
        address creator;
        string name;
        string description;
        string img;
        uint256 totalPledged;
        uint256 createdAt;
        bool closed;
        address rewardToken;
        TaskView[] tasks;
        SubmissionView[] submissions;
        address[] members;
        UserTaskStatus[] userTaskStatuses;
        string config;        // Add new field
    }

    // Define a struct for submission view
    struct SubmissionView {
        uint256 taskId;
        address submitter;
        string proof;
        int8 status;         // Changed from bool reviewed/approved to int8 status
        uint256 submittedAt;
        string reviewComment;
    }

    // Modify the UserTaskStatus struct definition.
    struct UserTaskStatus {
        uint256 taskId;
        bool submitted;
        int8 status;         // -1 = rejected, 0 = pending, 1 = approved
        uint256 submittedAt;
        string submitProof;  // Rename to avoid confusion with submitted
        string reviewComment;
    }

    // Define a simplified task detail view structure
    struct TaskDetailView {
        uint256 id;
        string name;
        address creator;
        string description;
        uint256 deadline;
        uint256 maxCompletions;
        uint256 numCompletions;
        bool completed;
        uint256 rewardAmount;
        uint256 createdAt;
        bool cancelled;
        string config;
        bool allowSelfCheck;
    }

    // Function to get task details
    function getTaskDetail(uint256 _boardId, uint256 _taskId) public view returns (TaskDetailView memory) {
        Board storage board = boards[_boardId];
        require(_taskId < board.tasks.length, "Task does not exist");

        Task storage task = board.tasks[_taskId];

        return TaskDetailView({
            id: task.id,
            name: task.name,
            creator: task.creator,
            description: task.description,
            deadline: task.deadline,
            maxCompletions: task.maxCompletions,
            numCompletions: task.numCompletions,
            completed: task.completed,
            rewardAmount: task.rewardAmount,
            createdAt: task.createdAt,
            cancelled: task.cancelled,
            config: task.config,
            allowSelfCheck: task.allowSelfCheck
        });
    }

    // Function to get board details
    function getBoardDetail(uint256 _boardId) public view returns (BoardDetailView memory) {
        Board storage board = boards[_boardId];

        // Get task list
        TaskView[] memory tasks = new TaskView[](board.tasks.length);
        for(uint i = 0; i < board.tasks.length; i++) {
            Task storage task = board.tasks[i];
            tasks[i] = TaskView({
                id: task.id,
                name: task.name,
                creator: task.creator,
                description: task.description,
                deadline: task.deadline,
                maxCompletions: task.maxCompletions,
                numCompletions: task.numCompletions,
                completed: task.completed,
                rewardAmount: task.rewardAmount,
                createdAt: task.createdAt,
                cancelled: task.cancelled,
                reviewers: task.reviewers,
                config: task.config,
                allowSelfCheck: task.allowSelfCheck
            });
        }

        // Get commit history
        uint256 submissionCount = 0;
        for (uint256 i = 0; i < board.tasks.length; i++) {
            for (uint256 j = 0; j < board.members.length; j++) {
                if (bountySubmissions[_boardId][i][board.members[j]].submitter != address(0)) {
                    submissionCount++;
                }
            }
        }

        SubmissionView[] memory submissions = new SubmissionView[](submissionCount);
        uint256 currentIndex = 0;
        for (uint256 i = board.tasks.length; i > 0; i--) {
            for (uint256 j = board.members.length; j > 0; j--) {
                address member = board.members[j - 1];
                Submission storage sub = bountySubmissions[_boardId][i - 1][member];
                if (sub.submitter != address(0)) {
                    submissions[currentIndex] = SubmissionView({
                        taskId: i - 1,
                        submitter: sub.submitter,
                        proof: bytes(sub.proof).length > 0 ? sub.proof : "",
                        status: sub.status,
                        submittedAt: sub.submittedAt,
                        reviewComment: bytes(sub.reviewComment).length > 0 ? sub.reviewComment : ""
                    });
                    currentIndex++;
                }
            }
        }

        // Get user task status
        UserTaskStatus[] memory userTaskStatuses = new UserTaskStatus[](board.tasks.length);
        for(uint i = 0; i < board.tasks.length; i++) {
            Task storage task = board.tasks[i];
            Submission storage submission = bountySubmissions[_boardId][task.id][msg.sender];

            userTaskStatuses[i] = UserTaskStatus({
                taskId: task.id,
                submitted: submission.submitter != address(0),
                status: submission.submitter != address(0) ? submission.status : int8(0),
                submittedAt: submission.submittedAt,
                submitProof: bytes(submission.proof).length > 0 ? submission.proof : "",
                reviewComment: bytes(submission.reviewComment).length > 0 ? submission.reviewComment : ""
            });
        }

        // Return the complete BoardDetailView.
        return BoardDetailView({
            currentUser: msg.sender,
            id: board.id,
            creator: board.creator,
            name: board.name,
            description: board.description,
            img: board.img,
            totalPledged: board.totalPledged,
            createdAt: board.createdAt,
            closed: board.closed,
            rewardToken: address(board.rewardToken),
            tasks: tasks,
            submissions: submissions,
            members: board.members,
            userTaskStatuses: userTaskStatuses,
            config: board.config     // Add new field
        });
    }

    // Get all Boards the user has joined
    function getBoardsByMember(address _member) public view returns (BoardView[] memory) {
        uint256 count = 0;
        for(uint256 i = 0; i < boardCount; i++) {
            if(isBoardMember(boardCount - i - 1, _member)) {
                count++;
            }
        }

        BoardView[] memory userBoards = new BoardView[](count);
        uint256 currentIndex = 0;

        for(uint256 i = 0; i < boardCount; i++) {
            if(isBoardMember(boardCount - i - 1, _member)) {
                Board storage board = boards[boardCount - i - 1];
                userBoards[currentIndex] = BoardView({
                    id: board.id,
                    creator: board.creator,
                    name: board.name,
                    description: board.description,
                    img: board.img,
                    totalPledged: board.totalPledged,
                    createdAt: board.createdAt,
                    rewardToken: address(board.rewardToken),
                    closed: board.closed,
                    config: board.config     // Add new field
                });
                currentIndex++;
            }
        }

        return userBoards;
    }
}

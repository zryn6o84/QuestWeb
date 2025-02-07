import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  UInt64,
  Permissions,
  Signature,
  AccountUpdate,
} from 'o1js';

/**
 * ReviewContract zkApp
 *
 * This contract stores task data (as a Field hash) and a submission hash,
 * along with a review status and review comment.
 *
 * On initialization, the task data and the reviewer's public key are set.
 *
 * A submitter can later submit their submission (provided as a Field hash).
 *
 * Then, the designated reviewer (expected to sign the transaction externally)
 * can call either:
 *    - approve: which updates the review status to "approved", stores the review comment,
 *      and sends a payment (in Mina tokens) to the submitter.
 *    - reject: which updates the review status to "rejected" and stores the review comment.
 *
 * Review Status values (stored as Field):
 *    0: Pending
 *    1: Approved
 *    2: Rejected
 */
export class ReviewContract extends SmartContract {
  @state(Field) taskData = State<Field>();         // Task data hash (or identifier)
  @state(Field) submissionHash = State<Field>();     // Submission data hash (to be set by submitter)
  @state(Field) reviewStatus = State<Field>();       // 0: pending, 1: approved, 2: rejected
  @state(Field) reviewComment = State<Field>();      // Review comment (stored as a Field hash)
  @state(PublicKey) reviewer = State<PublicKey>();     // Authorized reviewer public key

  // Public fields to store the fetched values
  public fetchedTaskData: Field = Field(0);
  public fetchedSubmissionHash: Field = Field(0);
  public fetchedReviewStatus: Field = Field(0);
  public fetchedReviewComment: Field = Field(0);
  public fetchedReviewer: PublicKey = PublicKey.empty();

  events = {
    'review-approved': Field,
    'review-rejected': Field,
    'submission-received': Field,
  };

  /**
   * Initializes the contract with the task data hash and the reviewer's public key.
   * Also sets the review status to pending (0) and clears any previous submission/review.
   *
   * @param taskData   A hash/identifier representing the task data.
   * @param reviewer   The public key of the authorized reviewer.
   */
  init() {
    super.init();
    // Set default values
    this.taskData.set(Field(0));
    this.submissionHash.set(Field(0));
    this.reviewStatus.set(Field(0));
    this.reviewComment.set(Field(0));
    this.reviewer.set(PublicKey.empty()); // Initialize with empty public key

    // Set permissions to allow state updates only with proofs
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
      send: Permissions.proofOrSignature(),
    });
  }

  @method async initializeContract(taskData: Field, reviewer: PublicKey): Promise<void> {
    // Verify the task data is not empty
    taskData.assertNotEquals(Field(0), "Task data cannot be empty");

    // Verify the reviewer is not empty
    reviewer.isEmpty().assertFalse("Reviewer cannot be empty");

    const currentTaskData = await this.taskData.getAndRequireEquals();
    currentTaskData.assertEquals(Field(0), "Contract already initialized");

    this.taskData.set(taskData);
    this.reviewer.set(reviewer);
  }

  /**
   * Allows a submitter to store their submission data.
   * Typically, the submission would be hashed off-chain and the hash provided here.
   * This method can only be called before the review status changes from pending.
   *
   * @param submissionHash The hash of the submission data.
   */
  @method async submit(submissionHash: Field): Promise<void> {
    // Verify the submission hash is not empty
    submissionHash.assertNotEquals(Field(0), "Submission hash cannot be empty");

    const currentStatus = await this.reviewStatus.getAndRequireEquals();
    currentStatus.assertEquals(Field(0), "Submission can only be made when status is pending");

    this.submissionHash.set(submissionHash);
    this.emitEvent('submission-received', submissionHash);
  }

  /**
   * Approves the submission.
   * When called, the review status is set to approved (1), the review comment is stored,
   * and a payment is sent to the submitter.
   *
   * IMPORTANT:
   * It is assumed that the transaction calling this method is signed by the designated reviewer.
   * (Enforce reviewer authorization off-chain or via permissions.)
   *
   * @param update       The account update object to send the payment.
   * @param submitter    The address of the submitter who will receive the payment.
   * @param paymentAmount The amount of Mina tokens (as UInt64) to send to the submitter.
   * @param reviewComment The review comment (hashed as a Field) to store on-chain.
   */
  @method async approve(update: AccountUpdate): Promise<void> {
    const currentStatus = await this.reviewStatus.getAndRequireEquals();
    currentStatus.assertEquals(Field(0), "Can only approve pending submissions");

    const submissionHash = await this.submissionHash.getAndRequireEquals();
    submissionHash.assertNotEquals(Field(0), "No submission to approve");

    // Verify the update is properly authorized
    update.requireSignature();
  }

  @method async approveSubmission(
    submitter: PublicKey,
    paymentAmount: UInt64,
    reviewComment: Field,
    signature: Signature
  ): Promise<void> {
    // Verify inputs
    submitter.isEmpty().assertFalse("Submitter cannot be empty");
    paymentAmount.assertGreaterThan(UInt64.from(0), "Payment amount must be positive");
    reviewComment.assertNotEquals(Field(0), "Review comment cannot be empty");

    const storedReviewer = await this.reviewer.getAndRequireEquals();

    // Create proof of valid signature
    const validSignature = signature.verify(storedReviewer, [
      reviewComment,
      submitter.toFields(),
      paymentAmount.toFields(),
    ].flat());
    validSignature.assertTrue("Invalid reviewer signature");

    const currentStatus = await this.reviewStatus.getAndRequireEquals();
    currentStatus.assertEquals(Field(0), "Can only approve pending submissions");

    // Update state with proofs
    this.reviewStatus.set(Field(1));
    this.reviewComment.set(reviewComment);

    // Create and verify payment
    const paymentUpdate = AccountUpdate.createSigned(this.address);
    paymentUpdate.send({ to: submitter, amount: paymentAmount });

    // Emit approval event with proof
    this.emitEvent('review-approved', reviewComment);
  }

  /**
   * Rejects the submission.
   * When called, the review status is set to rejected (2) and the review comment is stored.
   *
   * IMPORTANT:
   * It is assumed that the transaction calling this method is signed by the designated reviewer.
   *
   * @param update       The account update object to send the rejection event.
   * @param reviewComment The review comment (hashed as a Field) to store on-chain.
   */
  @method async rejectSubmission(reviewComment: Field, signature: Signature): Promise<void> {
    // Verify inputs
    reviewComment.assertNotEquals(Field(0), "Review comment cannot be empty");

    const storedReviewer = await this.reviewer.getAndRequireEquals();

    // Create proof of valid signature
    const validSignature = signature.verify(storedReviewer, [reviewComment]);
    validSignature.assertTrue("Invalid reviewer signature");

    const currentStatus = await this.reviewStatus.getAndRequireEquals();
    currentStatus.assertEquals(Field(0), "Can only reject pending submissions");

    // Update state with proofs
    this.reviewStatus.set(Field(2));
    this.reviewComment.set(reviewComment);

    // Emit rejection event with proof
    this.emitEvent('review-rejected', reviewComment);
  }

  // Helper methods to get state
  @method async getTaskData(): Promise<void> {
    this.fetchedTaskData = await this.taskData.getAndRequireEquals();
  }

  @method async getSubmissionHash(): Promise<void> {
    this.fetchedSubmissionHash = await this.submissionHash.getAndRequireEquals();
  }

  @method async getReviewStatus(): Promise<void> {
    this.fetchedReviewStatus = await this.reviewStatus.getAndRequireEquals();
  }

  @method async getReviewComment(): Promise<void> {
    this.fetchedReviewComment = await this.reviewComment.getAndRequireEquals();
  }

  @method async getReviewer(): Promise<void> {
    this.fetchedReviewer = await this.reviewer.getAndRequireEquals();
  }
}
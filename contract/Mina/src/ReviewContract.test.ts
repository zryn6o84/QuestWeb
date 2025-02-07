import { ReviewContract } from './ReviewContract';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  UInt64,
  Signature,
} from 'o1js';

describe('ReviewContract', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: ReviewContract;

  let proofsEnabled = false;

  beforeAll(async () => {
    if (proofsEnabled) await ReviewContract.compile();
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    const testAccounts = Local.testAccounts;
    deployerKey = testAccounts[0].key;
    deployerAccount = testAccounts[0].key.toPublicKey();
    senderKey = testAccounts[1].key;
    senderAccount = testAccounts[1].key.toPublicKey();
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new ReviewContract(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('deploys and initializes the ReviewContract', async () => {
    await localDeploy();

    const taskData = Field(123);
    const reviewer = senderAccount;

    const txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.initializeContract(taskData, reviewer);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    await zkApp.getTaskData();
    expect(zkApp.fetchedTaskData).toEqual(taskData);

    await zkApp.getReviewer();
    expect(zkApp.fetchedReviewer).toEqual(reviewer);
  });

  it('fails to initialize with invalid data', async () => {
    await localDeploy();

    const taskData = Field(0);
    const reviewer = senderAccount;

    await expect(async () => {
      const txn = await Mina.transaction(deployerAccount, async () => {
        await zkApp.initializeContract(taskData, reviewer);
      });
      await txn.prove();
    }).rejects.toThrow("Task data cannot be empty");
  });

  it('allows submission and approval with signature', async () => {
    await localDeploy();

    // Initialize contract
    const taskData = Field(123);
    const reviewer = senderAccount;
    let txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.initializeContract(taskData, reviewer);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    // Submit
    const submissionHash = Field(456);
    txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.submit(submissionHash);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    // Verify submission
    await zkApp.getSubmissionHash();
    expect(zkApp.fetchedSubmissionHash).toEqual(submissionHash);

    // Approve with signature
    const paymentAmount = UInt64.from(1000000);
    const reviewComment = Field(789);
    const signature = Signature.create(senderKey, [
      reviewComment,
      deployerAccount.toFields(),
      paymentAmount.toFields(),
    ].flat());

    txn = await Mina.transaction(senderAccount, async () => {
      const update = AccountUpdate.createSigned(senderAccount);
      await zkApp.approve(update);
      await zkApp.approveSubmission(deployerAccount, paymentAmount, reviewComment, signature);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // Verify approval
    await zkApp.getReviewStatus();
    expect(zkApp.fetchedReviewStatus).toEqual(Field(1));

    await zkApp.getReviewComment();
    expect(zkApp.fetchedReviewComment).toEqual(reviewComment);
  });

  it('allows submission and rejection with signature', async () => {
    await localDeploy();

    // Initialize contract
    const taskData = Field(123);
    const reviewer = senderAccount;
    let txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.initializeContract(taskData, reviewer);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    // Submit
    const submissionHash = Field(456);
    txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.submit(submissionHash);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    // Verify submission
    await zkApp.getSubmissionHash();
    expect(zkApp.fetchedSubmissionHash).toEqual(submissionHash);

    // Reject with signature
    const reviewComment = Field(789);
    const signature = Signature.create(senderKey, [reviewComment]);

    txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.rejectSubmission(reviewComment, signature);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // Verify rejection
    await zkApp.getReviewStatus();
    expect(zkApp.fetchedReviewStatus).toEqual(Field(2));

    await zkApp.getReviewComment();
    expect(zkApp.fetchedReviewComment).toEqual(reviewComment);
  });

  it('fails to approve without proper signature', async () => {
    await localDeploy();

    // Initialize and submit
    const taskData = Field(123);
    const reviewer = senderAccount;
    let txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.initializeContract(taskData, reviewer);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const submissionHash = Field(456);
    txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.submit(submissionHash);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    // Try to approve with wrong signature
    const paymentAmount = UInt64.from(1000000);
    const reviewComment = Field(789);
    const wrongKey = PrivateKey.random();
    const wrongSignature = Signature.create(wrongKey, [
      reviewComment,
      deployerAccount.toFields(),
      paymentAmount.toFields(),
    ].flat());

    await expect(async () => {
      txn = await Mina.transaction(senderAccount, async () => {
        const update = AccountUpdate.createSigned(senderAccount);
        await zkApp.approve(update);
        await zkApp.approveSubmission(deployerAccount, paymentAmount, reviewComment, wrongSignature);
      });
      await txn.prove();
    }).rejects.toThrow("Invalid reviewer signature");
  });
});
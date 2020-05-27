import { AppChallenge } from "@connext/types";
import { Wallet, Contract } from "ethers";
import { BigNumberish } from "ethers/utils";
import { AppWithCounterState, AppWithCounterAction, ActionType, AppWithCounterClass } from "./index";
export declare const setupContext: (appRegistry: Contract, appDefinition: Contract, providedWallet?: Wallet | undefined) => Promise<{
    alice: Wallet;
    bob: Wallet;
    state0: {
        counter: import("ethers/utils").BigNumber;
    };
    state1: {
        counter: import("ethers/utils").BigNumber;
    };
    action: {
        actionType: ActionType;
        increment: import("ethers/utils").BigNumber;
    };
    explicitlyFinalizingAction: {
        actionType: ActionType;
        increment: import("ethers/utils").BigNumber;
    };
    ONCHAIN_CHALLENGE_TIMEOUT: number;
    DEFAULT_TIMEOUT: number;
    appInstance: AppWithCounterClass;
    getChallenge: () => Promise<AppChallenge>;
    verifyChallenge: (expected: Partial<AppChallenge>) => Promise<void>;
    verifyEmptyChallenge: () => Promise<void>;
    isProgressable: () => Promise<any>;
    isFinalized: () => Promise<any>;
    isCancellable: (challenge?: AppChallenge | undefined) => Promise<any>;
    hasPassed: (timeout: BigNumberish) => Promise<any>;
    isDisputable: (challenge?: AppChallenge | undefined) => Promise<any>;
    verifySignatures: (digest?: string, signatures?: string[] | undefined, signers?: string[] | undefined) => Promise<any>;
    setOutcome: (encodedFinalState?: string | undefined) => Promise<void>;
    setOutcomeAndVerify: (encodedFinalState?: string | undefined) => Promise<void>;
    setState: (versionNumber: number, appState?: string | undefined, timeout?: number) => Promise<void>;
    setStateAndVerify: (versionNumber: number, appState?: string | undefined, timeout?: number) => Promise<void>;
    progressState: (state: AppWithCounterState, action: AppWithCounterAction, signer: Wallet, resultingState?: AppWithCounterState | undefined, resultingStateVersionNumber?: string | number | import("ethers/utils").BigNumber | ArrayLike<number> | undefined, resultingStateTimeout?: number | undefined) => Promise<void>;
    progressStateAndVerify: (state: AppWithCounterState, action: AppWithCounterAction, signer?: Wallet) => Promise<void>;
    setAndProgressState: (versionNumber: number, state: AppWithCounterState, action: AppWithCounterAction, timeout?: number, turnTaker?: Wallet) => Promise<void>;
    setAndProgressStateAndVerify: (versionNumber: number, state: AppWithCounterState, action: AppWithCounterAction, timeout?: number, turnTaker?: Wallet) => Promise<void>;
    cancelDispute: (versionNumber: number, signatures?: string[] | undefined) => Promise<void>;
    cancelDisputeAndVerify: (versionNumber: number, signatures?: string[] | undefined) => Promise<void>;
}>;
//# sourceMappingURL=context.d.ts.map
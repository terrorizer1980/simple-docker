import { AppIdentity, ChallengeStatus } from "@connext/types";
import { BigNumberish, BigNumber } from "ethers/utils";
export * from "./context";
export * from "../../utils";
export declare const randomState: (numBytes?: number) => string;
export declare type AppWithCounterState = {
    counter: BigNumber;
};
export declare enum ActionType {
    SUBMIT_COUNTER_INCREMENT = 0,
    ACCEPT_INCREMENT = 1
}
export declare enum TwoPartyFixedOutcome {
    SEND_TO_ADDR_ONE = 0,
    SEND_TO_ADDR_TWO = 1,
    SPLIT_AND_SEND_TO_BOTH_ADDRS = 2
}
export declare type AppWithCounterAction = {
    actionType: ActionType;
    increment: BigNumber;
};
export declare function encodeState(state: AppWithCounterState): string;
export declare function encodeAction(action: AppWithCounterAction): string;
export declare function encodeOutcome(): string;
export declare const computeCancelDisputeHash: (identityHash: string, versionNumber: BigNumber) => string;
export declare const appStateToHash: (state: string) => string;
export declare const computeAppChallengeHash: (id: string, appStateHash: string, versionNumber: BigNumberish, timeout: number) => string;
export declare class AppWithCounterClass {
    readonly participants: string[];
    readonly multisigAddress: string;
    readonly appDefinition: string;
    readonly defaultTimeout: number;
    readonly channelNonce: number;
    get identityHash(): string;
    get appIdentity(): AppIdentity;
    constructor(participants: string[], multisigAddress: string, appDefinition: string, defaultTimeout: number, channelNonce: number);
}
export declare const EMPTY_CHALLENGE: {
    versionNumber: BigNumber;
    appStateHash: string;
    status: ChallengeStatus;
    finalizesAt: BigNumber;
};
//# sourceMappingURL=index.d.ts.map
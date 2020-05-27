import { AppIdentity, BigNumber, EthereumCommitment, MinimalTransaction, SetStateCommitmentJSON, SignedAppChallengeUpdate } from "@connext/types";
export declare class SetStateCommitment implements EthereumCommitment {
    readonly challengeRegistryAddress: string;
    readonly appIdentity: AppIdentity;
    readonly appStateHash: string;
    readonly versionNumber: BigNumber;
    readonly stateTimeout: BigNumber;
    readonly appIdentityHash: string;
    private initiatorSignature?;
    private responderSignature?;
    constructor(challengeRegistryAddress: string, appIdentity: AppIdentity, appStateHash: string, versionNumber: BigNumber, stateTimeout: BigNumber, appIdentityHash?: string, initiatorSignature?: string | undefined, responderSignature?: string | undefined);
    get signatures(): string[];
    addSignatures(initiatorSignature: string | undefined, responderSignature: string | undefined): Promise<void>;
    set signatures(sigs: string[]);
    encode(): string;
    hashToSign(): string;
    getSignedTransaction(): Promise<MinimalTransaction>;
    toJson(): SetStateCommitmentJSON;
    static fromJson(json: SetStateCommitmentJSON): SetStateCommitment;
    getSignedAppChallengeUpdate(): Promise<SignedAppChallengeUpdate>;
    private assertSignatures;
}
//# sourceMappingURL=set-state-commitment.d.ts.map
export declare class STSClient {
    stsEndpoint: string | null;
    constructor();
    requestServiceJWT(account: string, nKeySeed: string, stsEndpoint?: string | null): Promise<any>;
    requestUserJWT(_namespace: string, _identity: string): Promise<void>;
}

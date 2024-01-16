export declare class STSClient {
    stsEndpoint: string | null;
    constructor();
    requestServiceJWT(nKeySeed: string, stsEndpoint?: string | null): Promise<any>;
    requestUserJWT(_namespace: string, _identity: string): Promise<void>;
}

import { AxiosInstance } from 'axios';
export declare class STSClient {
    stsEndpoint: string | null;
    axiosClient: AxiosInstance | null;
    constructor();
    init(stsEndpoint?: string): void;
    requestServiceJWT(nKeySeed: string, stsEndpoint?: string | null): Promise<any>;
    requestUserJWT(_namespace: string, _identity: string): Promise<void>;
    private requestJSON;
    private postJSON;
}

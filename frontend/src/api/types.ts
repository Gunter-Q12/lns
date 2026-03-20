import { NftResponse } from './nftTypes';


export interface ApiClient {
  getNft(): Promise<NftResponse>;
  getRoute(): Promise<any>;
  getAddr(): Promise<any>;
}

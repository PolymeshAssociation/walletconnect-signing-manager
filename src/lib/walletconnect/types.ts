import type { InjectedAccount } from '@polkadot/extension-inject/types';
import type { CreateAppKit } from '@reown/appkit';
import type { SignClientTypes } from '@walletconnect/types';

import type { WalletConnectSigner } from './signer';

export type WcAccount = `${string}:${string}:${string}`;

export type PolkadotNamespaceChainId = `polkadot:${string}`;

export interface WalletOptionsType {
  id: string;
  name: string;
  links: {
    native: string;
    universal?: string;
  };
}

/**
 * Configuration for WalletConnect integration.
 * Extends SignClientTypes.Options for proper SignClient initialization.
 */
export interface WalletConnectConfiguration extends SignClientTypes.Options {
  projectId: string;
  chainIds?: PolkadotNamespaceChainId[];
  optionalChainIds?: PolkadotNamespaceChainId[];
  onSessionDelete?: () => void;
  handleConnectUri?: (uri: string) => void;
  /**
   * Reown AppKit modal configuration options.
   * Accepts all CreateAppKit options except projectId, networks, and metadata which are set internally.
   * @see https://docs.reown.com/appkit/react/core/options
   */
  modalOptions?: Partial<Omit<CreateAppKit, 'projectId' | 'networks' | 'metadata'>>;
}

export interface WalletMetadata {
  id: string;
  title: string;
  description?: string;
  urls?: { main?: string; browsers?: Record<string, string> };
  iconUrl?: string;
  version?: string;
}

export type UnsubCallback = () => void;

export interface BaseWallet {
  metadata: WalletMetadata;
  signer: WalletConnectSigner | undefined;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: () => boolean;
  getAccounts: () => Promise<InjectedAccount[]>;
  subscribeAccounts: (cb: (accounts: InjectedAccount[]) => void) => UnsubCallback;
}

import Client, { SignClient } from '@walletconnect/sign-client';
import type { SessionTypes } from '@walletconnect/types';

import { WalletConnectSigner } from '../signer';
import type { WalletConnectConfiguration } from '../types';
import { POLYMESH_CHAIN_ID, WalletConnect, WC_VERSION } from '../walletconnect';

jest.mock('@walletconnect/sign-client');

// Mock @reown/appkit to avoid ESM import issues in tests
const mockModal = {
  open: jest.fn(),
  close: jest.fn(),
};
const mockCreateAppKit = jest.fn(() => mockModal);

jest.mock('@reown/appkit', () => ({
  createAppKit: mockCreateAppKit,
}));

jest.mock('@reown/appkit/networks', () => ({
  defineChain: jest.fn((config) => config),
}));

describe('WalletConnect', () => {
  let config: WalletConnectConfiguration;
  let walletConnect: WalletConnect;
  let clientMock: jest.Mocked<Client>;
  let sessionMock: SessionTypes.Struct;

  beforeEach(() => {
    config = {
      projectId: '4fae85e642724ee66587fa9f37b997e2',
      metadata: {
        name: 'Polymesh Signing Manager Demo',
        description: 'Signing Manager Demo',
        url: 'https://polymesh.network',
        icons: [
          'https://assets-global.website-files.com/61c0a31b90958801836efe1b/62d08014db27c031ec24b6f6_polymesh-symbol.svg',
        ],
      },
      chainIds: [POLYMESH_CHAIN_ID],
      storageOptions: { database: 'testLocalDatabase' },
      handleConnectUri: jest.fn(),
      onSessionDelete: jest.fn(),
    };

    sessionMock = {
      topic: '0fad0dec80bf1226eb1646defde76536a86f0a06e604bd28f98c08c564b0e035',
      relay: { protocol: 'irn' },
      expiry: Math.floor(Date.now() / 1000) + 1000,
      namespaces: {
        polkadot: {
          accounts: [
            'polkadot:6fbd74e5e1d0a61d52ccfe9d4adaed16:5Ci1xTypyBSv1kN5kS5zzFbm1fcfyY6RCqNsDieeYhFjTtVj',
          ],
          methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
          events: ['chainChanged', 'accountsChanged'],
          chains: ['polkadot:6fbd74e5e1d0a61d52ccfe9d4adaed16'],
        },
      },
      acknowledged: true,
      pairingTopic: '0bea69835975b2e1e9b0653557371572c7a9a435a4d99d00fc888f42b9982db9',
      requiredNamespaces: {
        polkadot: {
          chains: ['polkadot:6fbd74e5e1d0a61d52ccfe9d4adaed16'],
          methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
          events: ['chainChanged', 'accountsChanged'],
        },
      },
      optionalNamespaces: {},
      controller: '886e9e42f7c650a21ec121a70f074a07d4f75937dead2a16de1d9ab0c0136d5b',
      self: {
        publicKey: '6c96551a13e944f472cf7b895fddbb00c9a7894c81988a837399f3c940510810',
        metadata: {
          name: 'Polymesh Signing Manager Demo',
          description: 'Signing Manager Demo',
          url: 'https://polymesh.network',
          icons: [
            'https://assets-global.website-files.com/61c0a31b90958801836efe1b/62d08014db27c031ec24b6f6_polymesh-symbol.svg',
          ],
        },
      },
      peer: {
        publicKey: '886e9e42f7c650a21ec121a70f074a07d4f75937dead2a16de1d9ab0c0136d5b',
        metadata: {
          name: 'SubWallet',
          description: 'React Wallet for WalletConnect',
          url: 'https://www.subwallet.app/',
          icons: [
            'https://raw.githubusercontent.com/Koniverse/SubWallet-Extension/master/packages/extension-koni/public/images/icon-128.png',
          ],
        },
      },
    };

    // Mock the client
    clientMock = {
      connect: jest.fn(),
      session: {
        getAll: jest.fn(),
      } as unknown as Client['session'],
      on: jest.fn(),
      off: jest.fn(),
      disconnect: jest.fn(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Client>;

    (clientMock.session.getAll as jest.Mock).mockReturnValue([]);

    // Mock the connect method of the client
    clientMock.connect.mockResolvedValue({
      uri: 'test-uri',
      approval: jest.fn().mockResolvedValue(sessionMock),
    });

    // Mock SignClient.init to return the mocked client
    jest.spyOn(SignClient, 'init').mockResolvedValue(clientMock);

    walletConnect = new WalletConnect(config, 'TestApp');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with given config and appName', () => {
      expect(walletConnect.appName).toBe('TestApp');
      expect(walletConnect.config).toBe(config);
      expect(walletConnect.metadata).toEqual({
        id: 'walletconnect',
        title: 'Polymesh Signing Manager Demo',
        description: 'Signing Manager Demo',
        urls: { main: 'https://polymesh.network' },
        iconUrl:
          'https://assets-global.website-files.com/61c0a31b90958801836efe1b/62d08014db27c031ec24b6f6_polymesh-symbol.svg',
        version: WC_VERSION,
      });
    });

    it('should set default chainIds if an empty array is provided', () => {
      const configWithoutChainIds = { ...config, chainIds: [] };
      walletConnect = new WalletConnect(configWithoutChainIds, 'TestApp');
      expect(walletConnect.config.chainIds).toEqual([POLYMESH_CHAIN_ID]);
    });

    it('should set default chainIds if not provided', () => {
      const configWithoutChainIds = { ...config, chainIds: undefined };
      walletConnect = new WalletConnect(configWithoutChainIds, 'TestApp');
      expect(walletConnect.config.chainIds).toEqual([POLYMESH_CHAIN_ID]);
    });

    it('should use default values for missing metadata fields', () => {
      const minimalConfig: WalletConnectConfiguration = {
        projectId: '4fae85e642724ee66587fa9f37b997e2',
        chainIds: [POLYMESH_CHAIN_ID],
        storageOptions: { database: 'testLocalDatabase' },
        handleConnectUri: jest.fn(),
      };
      walletConnect = new WalletConnect(minimalConfig, 'TestApp');
      
      expect(walletConnect.metadata).toEqual({
        id: 'walletconnect',
        title: 'WalletConnect',
        description: '',
        urls: { main: '' },
        iconUrl: '',
        version: WC_VERSION,
      });
    });

    it('should handle partial metadata with missing optional fields', () => {
      const partialMetadataConfig = {
        ...config,
        metadata: {
          name: 'Test App',
          description: 'Test Description',
          url: 'https://test.com',
          icons: [],
        },
      };
      walletConnect = new WalletConnect(partialMetadataConfig, 'TestApp');
      
      expect(walletConnect.metadata).toEqual({
        id: 'walletconnect',
        title: 'Test App',
        description: 'Test Description',
        urls: { main: 'https://test.com' },
        iconUrl: '',
        version: WC_VERSION,
      });
    });
  });

  describe('connect', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should initialize client and handle connect URI', async () => {
      await walletConnect.connect();

      expect(clientMock.connect).toHaveBeenCalled();
      expect(walletConnect.client).toBe(clientMock);
      expect(config.handleConnectUri).toHaveBeenCalledWith('test-uri');
    });

    it('should set session and signer if session approval is granted', async () => {
      await walletConnect.connect();

      expect(walletConnect.session).toBe(sessionMock);
      expect(walletConnect.signer).toBeInstanceOf(WalletConnectSigner);
    });

    it('should throw an error if approval is rejected', async () => {
      clientMock.connect.mockResolvedValueOnce({
        uri: 'test-uri',
        approval: jest.fn().mockRejectedValue(new Error('User rejected.')),
      });

      await expect(walletConnect.connect()).rejects.toThrow('User rejected.');
    });

    it('should handle existing sessions and set session and signer if valid', async () => {
      const validSession = { ...sessionMock, expiry: Math.floor(Date.now() / 1000) + 1000 };
      (clientMock.session.getAll as jest.Mock).mockReturnValue([validSession]);

      await walletConnect.connect();

      expect(walletConnect.session).toBe(validSession);
      expect(walletConnect.signer).toBeInstanceOf(WalletConnectSigner);
      expect(clientMock.connect).not.toHaveBeenCalled();
    });

    it('should handle optionalNamespaces if optionalChainIds are provided', async () => {
      config.optionalChainIds = ['polkadot:optional-chain-id'];
      walletConnect = new WalletConnect(config, 'TestApp');

      await walletConnect.connect();

      expect(clientMock.connect).toHaveBeenCalledWith({
        requiredNamespaces: {
          polkadot: {
            chains: [POLYMESH_CHAIN_ID],
            methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
        optionalNamespaces: {
          polkadot: {
            chains: ['polkadot:optional-chain-id'],
            methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });
    });

    it('should open modal if handleConnectUri is not provided', async () => {
      // Remove handleConnectUri to trigger modal path
      delete config.handleConnectUri;
      walletConnect = new WalletConnect(config, 'TestApp');

      jest.spyOn(SignClient, 'init').mockResolvedValue(clientMock);

      await walletConnect.connect();

      // Verify createAppKit was called with correct config
      expect(mockCreateAppKit).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: config.projectId,
          networks: expect.arrayContaining([
            expect.objectContaining({
              id: '6fbd74e5e1d0a61d52ccfe9d4adaed16',
              name: 'Polymesh',
              chainNamespace: 'polkadot',
            }),
            expect.objectContaining({
              id: '2ace05e703c5409e39d42f1a11ddcfac',
              name: 'Polymesh Testnet',
              chainNamespace: 'polkadot',
              testnet: true,
            }),
          ]),
          metadata: config.metadata,
          featuredWalletIds: expect.arrayContaining([
            '43fd1a0aeb90df53ade012cca36692a46d265f0b99b7561e645af42d752edb92',
            '9ce87712b99b3eb57396cc8621db8900ac983c712236f48fb70ad28760be3f6a',
          ]),
          includeWalletIds: expect.arrayContaining([
            '43fd1a0aeb90df53ade012cca36692a46d265f0b99b7561e645af42d752edb92',
            '9ce87712b99b3eb57396cc8621db8900ac983c712236f48fb70ad28760be3f6a',
          ]),
          manualWCControl: true,
        })
      );

      // Verify modal.open was called with URI
      expect(mockModal.open).toHaveBeenCalledWith({ uri: 'test-uri' });

      // Verify session was set
      expect(walletConnect.session).toBe(sessionMock);
      expect(walletConnect.signer).toBeInstanceOf(WalletConnectSigner);

      // Verify modal.close was called after approval
      expect(mockModal.close).toHaveBeenCalled();
    });

    it('should apply modalOptions overrides when provided', async () => {
      delete config.handleConnectUri;
      config.modalOptions = {
        themeMode: 'light',
        themeVariables: {
          '--apkt-accent': '#FF0000',
        },
        includeWalletIds: ['custom-wallet-id'],
      };
      walletConnect = new WalletConnect(config, 'TestApp');

      jest.spyOn(SignClient, 'init').mockResolvedValue(clientMock);

      await walletConnect.connect();

      // Verify modalOptions were spread into config
      expect(mockCreateAppKit).toHaveBeenCalledWith(
        expect.objectContaining({
          themeMode: 'light',
          themeVariables: {
            '--apkt-accent': '#FF0000',
          },
          includeWalletIds: ['custom-wallet-id'],
        })
      );
    });

    it('should close modal and throw error if approval fails', async () => {
      delete config.handleConnectUri;
      walletConnect = new WalletConnect(config, 'TestApp');

      const approvalError = new Error('User rejected connection');
      clientMock.connect.mockResolvedValueOnce({
        uri: 'test-uri',
        approval: jest.fn().mockRejectedValue(approvalError),
      });

      jest.spyOn(SignClient, 'init').mockResolvedValue(clientMock);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(walletConnect.connect()).rejects.toThrow('User rejected connection');

      // Verify modal was opened
      expect(mockModal.open).toHaveBeenCalledWith({ uri: 'test-uri' });

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[WalletConnect] Error during session approval:',
        approvalError
      );

      // Verify modal.close was called even after error
      expect(mockModal.close).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should log warning if no URI is generated', async () => {
      clientMock.connect.mockResolvedValueOnce({
        uri: undefined,
        approval: jest.fn().mockResolvedValue(sessionMock),
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await walletConnect.connect();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WalletConnect] No URI generated - connection may have failed'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should call onSessionDelete callback on session_delete event', async () => {
      await walletConnect.connect();
      const sessionDeleteListener = clientMock.on.mock.calls.find(
        ([event]) => event === 'session_delete'
      )?.[1];

      if (sessionDeleteListener) {
        sessionDeleteListener({
          id: 123456,
          topic: '0fad0dec80bf1226eb1646defde76536a86f0a06e604bd28f98c08c564b0e035',
        });
      }

      expect(walletConnect.session).toBeUndefined();
      expect(walletConnect.signer).toBeUndefined();
      expect(config.onSessionDelete).toHaveBeenCalled();
    });

    it('should call onSessionDelete callback on session_expire event', async () => {
      await walletConnect.connect();
      const sessionExpireListener = clientMock.on.mock.calls.find(
        ([event]) => event === 'session_expire'
      )?.[1];

      if (sessionExpireListener) {
        sessionExpireListener({
          topic: '0fad0dec80bf1226eb1646defde76536a86f0a06e604bd28f98c08c564b0e035',
        });
      }

      expect(walletConnect.session).toBeUndefined();
      expect(walletConnect.signer).toBeUndefined();
      expect(config.onSessionDelete).toHaveBeenCalled();
    });

    it('should call onSessionDelete callback on session_extend event', async () => {
      await walletConnect.connect();
      const sessionUpdateListener = clientMock.on.mock.calls.find(
        ([event]) => event === 'session_extend'
      )?.[1];
      const sessionData = { ...sessionMock, expiry: Math.floor(Date.now() / 1000) + 1000 };
      (clientMock.session.getAll as jest.Mock).mockReturnValueOnce([sessionData]);

      if (sessionUpdateListener) {
        sessionUpdateListener(sessionData);
      }

      expect(walletConnect.session).toEqual(sessionData);
      expect(walletConnect.signer?.session).toEqual(sessionData);
    });

    it('should not update session and signer if no session data is available', async () => {
      await walletConnect.connect();
      const sessionUpdateListener = clientMock.on.mock.calls.find(
        ([event]) => event === 'session_extend'
      )?.[1];
      (clientMock.session.getAll as jest.Mock).mockReturnValueOnce([]);

      if (sessionUpdateListener) {
        sessionUpdateListener(sessionMock);
      }

      expect(walletConnect.session).toBeUndefined();
      expect(walletConnect.signer).toBeUndefined();
    });
  });

  describe('getAccounts', () => {
    it('should return accounts from session', async () => {
      walletConnect.session = sessionMock;

      const accounts = await walletConnect.getAccounts();

      expect(accounts).toEqual([{ address: '5Ci1xTypyBSv1kN5kS5zzFbm1fcfyY6RCqNsDieeYhFjTtVj' }]);
    });

    it('should return empty array if no session', async () => {
      const accounts = await walletConnect.getAccounts();

      expect(accounts).toEqual([]);
    });
  });

  describe('subscribeAccounts', () => {
    it('should call callback with accounts and handle session events', async () => {
      await walletConnect.connect();

      const cb = jest.fn();

      const unsub = walletConnect.subscribeAccounts(cb);

      await new Promise(process.nextTick);
      // Initial callback check
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenNthCalledWith(1, [
        { address: '5Ci1xTypyBSv1kN5kS5zzFbm1fcfyY6RCqNsDieeYhFjTtVj' },
      ]);

      // Simulate session_delete event
      clientMock.on.mock.calls
        .filter(([event]) => event === 'session_delete')
        .forEach(([, listener]) =>
          listener?.({
            id: 123456,
            topic: '0fad0dec80bf1226eb1646defde76536a86f0a06e604bd28f98c08c564b0e035',
          })
        );

      await new Promise(process.nextTick);
      // Verify session deletion
      expect(walletConnect.session).toBe(undefined);
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenNthCalledWith(2, []);

      const validSession = { ...sessionMock, expiry: Math.floor(Date.now() / 1000) + 1000 };
      (clientMock.session.getAll as jest.Mock).mockReturnValue([validSession]);

      // Simulate session_update event
      clientMock.on.mock.calls
        .filter(([event]) => event === 'session_update')
        .forEach(([, listener]) => {
          listener?.(sessionMock);
        });

      await new Promise(process.nextTick);

      expect(cb).toHaveBeenCalledTimes(3);
      expect(cb).toHaveBeenNthCalledWith(3, [
        { address: '5Ci1xTypyBSv1kN5kS5zzFbm1fcfyY6RCqNsDieeYhFjTtVj' },
      ]);

      unsub();

      // Ensure event listeners are removed
      expect(clientMock.off).toHaveBeenCalledWith('session_delete', expect.any(Function));
      expect(clientMock.off).toHaveBeenCalledWith('session_update', expect.any(Function));
      expect(clientMock.off).toHaveBeenCalledWith('session_expire', expect.any(Function));
    });
  });

  describe('disconnect', () => {
    it('should disconnect client and reset wallet', async () => {
      await walletConnect.connect();
      expect(walletConnect.client).not.toBeUndefined();
      expect(walletConnect.session).not.toBeUndefined();
      expect(walletConnect.signer).not.toBeUndefined();

      await walletConnect.disconnect();

      expect(walletConnect.client).toBeUndefined();
      expect(walletConnect.session).toBeUndefined();
      expect(walletConnect.signer).toBeUndefined();
      expect(clientMock.disconnect).toBeCalled();
      // Ensure event listeners are removed
      expect(clientMock.off).toHaveBeenCalledWith('session_delete', expect.any(Function));
      expect(clientMock.off).toHaveBeenCalledWith('session_update', expect.any(Function));
      expect(clientMock.off).toHaveBeenCalledWith('session_expire', expect.any(Function));
      expect(clientMock.off).toHaveBeenCalledWith('session_extend', expect.any(Function));
    });

    it('should reset the wallet even if there is no active session', async () => {
      await walletConnect.connect();
      walletConnect.session = undefined;
      await walletConnect.disconnect();

      expect(walletConnect.client).toBeUndefined();
      expect(walletConnect.session).toBeUndefined();
      expect(walletConnect.signer).toBeUndefined();
      expect(clientMock.disconnect).not.toBeCalled();

      // Ensure event listeners are removed
      expect(clientMock.off).toHaveBeenCalledWith('session_delete', expect.any(Function));
      expect(clientMock.off).toHaveBeenCalledWith('session_update', expect.any(Function));
      expect(clientMock.off).toHaveBeenCalledWith('session_expire', expect.any(Function));
      expect(clientMock.off).toHaveBeenCalledWith('session_extend', expect.any(Function));
    });

    it('should reset wallet even when session has no topic', async () => {
      await walletConnect.connect();
      // Create session without topic
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      walletConnect.session = { ...sessionMock, topic: undefined } as any;
      
      await walletConnect.disconnect();

      expect(walletConnect.client).toBeUndefined();
      expect(walletConnect.session).toBeUndefined();
      expect(walletConnect.signer).toBeUndefined();
      expect(clientMock.disconnect).not.toHaveBeenCalled();
    });

    it('should handle disconnect when unsubscribeEvents is not set', async () => {
      await walletConnect.connect();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (walletConnect as any).unsubscribeEvents = undefined;
      
      await walletConnect.disconnect();

      expect(walletConnect.client).toBeUndefined();
      expect(walletConnect.session).toBeUndefined();
      expect(walletConnect.signer).toBeUndefined();
    });
  });

  describe('isConnected', () => {
    it('should return true if client, signer, and session are defined', () => {
      walletConnect.client = clientMock;
      walletConnect.session = sessionMock;
      walletConnect.signer = new WalletConnectSigner(clientMock, sessionMock);

      expect(walletConnect.isConnected()).toBe(true);
    });

    it('should return false if any of client, signer, or session are undefined', () => {
      expect(walletConnect.isConnected()).toBe(false);
    });
  });
});

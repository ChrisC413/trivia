class PlayerNameService {
    private static instance: PlayerNameService;
    private playerMap: Set<{ id: string; name: string; securityToken: string; createdAt: number }>;

    private constructor() {
        this.playerMap = new Set();
    }

    public static getInstance(): PlayerNameService {
        if (!PlayerNameService.instance) {
            PlayerNameService.instance = new PlayerNameService();
        }
        return PlayerNameService.instance;
    }

    public registerPlayer(id: string, name: string): string {
        const createdAt = Date.now();
        const securityToken = this.generateUUID();
        this.playerMap.add({ id, name, securityToken, createdAt });
        return securityToken;
    }

    private generateUUID(): string {
        // Simple UUID generation logic
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public validateSecurityToken(securityToken: string, playerId: string): boolean {
        const player = Array.from(this.playerMap.values()).find(p => p.id === playerId && p.securityToken === securityToken);
        return !!player;
    }

    public getPlayerName(playerId: string): string | undefined {
        const player = Array.from(this.playerMap.values()).find(p => p.id === playerId);
        return player?.name;
    }
}

export const playerNameService = PlayerNameService.getInstance();
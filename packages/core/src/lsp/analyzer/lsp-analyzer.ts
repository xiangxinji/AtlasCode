import { spawn } from 'child_process';
import * as rpc from 'vscode-jsonrpc/node';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from '@vue/compiler-sfc';

export class LspAnalyzer {
    private connection!: rpc.MessageConnection;
    private lspProcess!: any;
    private filePath: string;
    private fileExt: string;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.fileExt = path.extname(filePath).toLowerCase();
    }

    /**
     * 1. 核心魔法：针对 Vue 和样式文件进行“内容洗白”
     * 确保喂给特定 LSP 的代码是它能听懂的，且行号绝不偏移！
     */
    private getProcessedContent(rawContent: string): string {
        // 场景 A：Vue 文件 -> 提取 <script>
        if (this.fileExt === '.vue') {
            const { descriptor } = parse(rawContent);
            const scriptBlock = descriptor.scriptSetup || descriptor.script;
            if (!scriptBlock) return '';

            const startLine = scriptBlock.loc.start.line - 1;
            const padding = '\n'.repeat(startLine);
            return padding + scriptBlock.content;
        }

        // 场景 B：其他文件（JS, TS, CSS, Less, Sass）-> 直接返回源码
        return rawContent;
    }

    /**
     * 2. 获取当前文件对应的 Language ID
     */
    private getLanguageId(): string {
        switch (this.fileExt) {
            case '.vue': return 'typescript'; // 欺骗 TS，当作 ts 处理
            case '.ts': return 'typescript';
            case '.js': return 'javascript';
            case '.css': return 'css';
            case '.less': return 'less';
            case '.scss':
            case '.sass': return 'scss';
            default: return 'plaintext';
        }
    }

    /**
     * 3. 核心路由：根据文件后缀，启动对应的 LSP 专家进程
     */
    private spawnLspProcess() {
        const styleExts = ['.css', '.less', '.scss', '.sass'];

        if (styleExts.includes(this.fileExt)) {
            console.log(`🎨 检测到样式文件 [${this.fileExt}]，启动 CSS Language Server...`);
            // 需要提前安装 vscode-css-languageserver-bin
            return spawn('npx', ['css-languageserver', '--stdio'], { shell: true });
        } else {
            console.log(`javascript 检测到逻辑文件 [${this.fileExt}]，启动 TypeScript Language Server...`);
            return spawn('npx', ['typescript-language-server', '--stdio'], { shell: true });
        }
    }

    /**
     * 4. 初始化并连接到对应的 LSP
     */
    async init() {
        this.lspProcess = this.spawnLspProcess();

        this.connection = rpc.createMessageConnection(
            new rpc.StreamMessageReader(this.lspProcess.stdout!),
            new rpc.StreamMessageWriter(this.lspProcess.stdin!)
        );
        this.connection.listen();

        // 统一发送 initialize 请求
        await this.connection.sendRequest(
            new rpc.RequestType<any, any, any>('initialize'),
            {
                processId: process.pid,
                rootUri: `file://${path.resolve(process.cwd())}`,
                capabilities: {
                    textDocument: {
                        definition: { dynamicRegistration: true },
                        references: { dynamicRegistration: true }
                    }
                }
            }
        );

        await this.connection.sendNotification(new rpc.NotificationType<any>('initialized'), {});
        console.log(`🤖 [${this.fileExt}] 专属 LSP 引擎初始化成功，正在建立索引...\n`);
    }

    /**
     * 5. 打开文档（带内容清洗）
     */
    private async openDocument(absolutePath: string, fileUri: string) {
        const rawContent = fs.readFileSync(absolutePath, 'utf-8');
        const fileContent = this.getProcessedContent(rawContent);

        await this.connection.sendNotification(
            new rpc.NotificationType<any>('textDocument/didOpen'),
            {
                textDocument: {
                    uri: fileUri,
                    languageId: this.getLanguageId(),
                    version: 1,
                    text: fileContent
                }
            }
        );
    }

    /**
     * 6. 核心功能：查找定义 (Goto Definition)
     */
    async findDefinition(line: number, character: number) {
        const absolutePath = path.resolve(this.filePath);
        const fileUri = `file://${absolutePath}`;

        await this.openDocument(absolutePath, fileUri);

        console.log(`🔎 正在查找 [${this.filePath}] 第 ${line} 行，第 ${character} 列的定义...`);

        const result: any = await this.connection.sendRequest(
            new rpc.RequestType<any, any, any>('textDocument/definition'),
            {
                textDocument: { uri: fileUri },
                position: { line, character }
            }
        );

        return result;
    }

    /**
     * 7. 核心功能：查找所有引用 (Find References)
     */
    async findReferences(line: number, character: number) {
        const absolutePath = path.resolve(this.filePath);
        const fileUri = `file://${absolutePath}`;

        await this.openDocument(absolutePath, fileUri);

        console.log(`🔎 正在查找 [${this.filePath}] 第 ${line} 行，第 ${character} 列的【所有引用】...`);

        const result = await this.connection.sendRequest(
            new rpc.RequestType<any, any, any>('textDocument/references'),
            {
                textDocument: { uri: fileUri },
                position: { line, character },
                context: { includeDeclaration: true }
            }
        );

        return result;
    }

    /**
     * 8. 优雅关闭
     */
    async destroy() {
        await this.connection.sendRequest(new rpc.RequestType<any, any, any>('shutdown'), {});
        this.connection.dispose();
        this.lspProcess.kill();
    }
}
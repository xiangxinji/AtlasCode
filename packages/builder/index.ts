import { DependencyAnalyzer } from "../core/src/repo-map";
import { ProjectDetector } from "../core/src/env/project-detector";
import { ProjectRulesExtractor } from "../core/src/rules";
import { RepoMapExtractor } from "@/core/src/repo-map/extractor/extractor";
import { PageRankReranker } from "@/core/src/repo-map/reranker/reranker";

export interface BuilderOptions {
    projectPath: string;
}

export interface BuildContext {
    projectPath: string;
};


export class Builder {
    private context: BuildContext;

    constructor({ projectPath }: BuilderOptions) {
        this.context = { projectPath };
    }

    async build() {
        const detector = new ProjectDetector(this.context.projectPath);
        const framework = detector.detect();

        if (framework === 'unknown') {
            throw new Error('项目未检测到框架类型');
        }

        const analyzer = new DependencyAnalyzer({
            scanOptions: {
                framework: framework,
                verbose: true
            }
        });

        await analyzer.initialize();
        const result = analyzer.scanDirectory(this.context.projectPath);


        const e = new RepoMapExtractor();
        console.log(e.sortByImportance(e.buildStandardMap(result)));
        
    }

}
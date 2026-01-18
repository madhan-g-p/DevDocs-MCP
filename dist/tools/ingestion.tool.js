"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionTool = void 0;
const common_1 = require("@nestjs/common");
const ingestion_service_1 = require("../docs/ingestion.service");
const path = require("path");
const fs = require("fs");
let IngestionTool = class IngestionTool {
    constructor(ingestion) {
        this.ingestion = ingestion;
    }
    async execute(input) {
        if (!input.dependencies || typeof input.dependencies !== 'object' || Object.keys(input.dependencies).length === 0) {
            throw new Error('dependencies must be a non-empty object mapping package names to versions (e.g., {"react": "18.2.0"})');
        }
        for (const [pkg, ver] of Object.entries(input.dependencies)) {
            if (typeof pkg !== 'string' || pkg.trim().length === 0) {
                throw new Error(`Invalid package name: "${pkg}" must be a non-empty string`);
            }
            if (typeof ver !== 'string' || ver.trim().length === 0) {
                throw new Error(`Invalid version for package "${pkg}": must be a non-empty string`);
            }
        }
        const base = input.devdocsBase || process.env.DEVDOCS_DATA_PATH || path.join(process.cwd(), 'data');
        try {
            if (!fs.existsSync(base)) {
                fs.mkdirSync(base, { recursive: true });
            }
            const testFile = path.join(base, '.write_test');
            fs.writeFileSync(testFile, '');
            fs.unlinkSync(testFile);
        }
        catch (e) {
            throw new Error(`Cannot access data directory at ${base}: ${e.message}. Please ensure the directory exists and is writable.`);
        }
        try {
            const results = await this.ingestion.ingestProjectDocs(input.dependencies, base);
            const message = results.map(r => {
                let msg = `${r.package}@${r.version}: ${r.status}`;
                if (r.caveat)
                    msg += ` (Note: ${r.caveat})`;
                return msg;
            }).join('\n');
            return {
                status: results.every(r => r.status !== 'failed') ? 'success' : 'partial_success',
                message,
                details: results
            };
        }
        catch (e) {
            throw new Error(`Documentation ingestion failed: ${e.message}`);
        }
    }
};
exports.IngestionTool = IngestionTool;
exports.IngestionTool = IngestionTool = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ingestion_service_1.IngestionService])
], IngestionTool);

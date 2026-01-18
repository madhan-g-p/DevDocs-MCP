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
exports.RelatedTool = void 0;
const common_1 = require("@nestjs/common");
const docs_service_1 = require("../docs/docs.service");
let RelatedTool = class RelatedTool {
    constructor(docs) {
        this.docs = docs;
    }
    async execute(input) {
        const relatedDocs = await this.docs.getRelatedDocs(input.docId);
        return {
            related: relatedDocs.map(doc => ({
                id: doc.id,
                title: doc.title,
                relation: doc.relation
            }))
        };
    }
};
exports.RelatedTool = RelatedTool;
exports.RelatedTool = RelatedTool = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [docs_service_1.DocsService])
], RelatedTool);

import { Injectable } from '@nestjs/common';
import { DocsService } from '../docs/docs.service';
import { RelatedInput } from '../types/tools';

@Injectable()
export class RelatedTool {
  constructor(private readonly docs: DocsService) {}

  async execute(input: RelatedInput) {
    const relatedDocs = await this.docs.getRelatedDocs(input.docId);
    return {
      related: relatedDocs.map(doc => ({
        id: doc.id,
        title: doc.title,
        relation: doc.relation
      }))
    };
  }
}

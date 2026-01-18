import { Injectable } from '@nestjs/common';
import { DocsService } from '../docs/docs.service';
import { ExplainInput } from '../types/tools';

@Injectable()
export class ExplainTool {
  constructor(private readonly docs: DocsService) {}

  async execute(input: ExplainInput) {
    return await this.docs.loadDoc(input.docId);
  }
}

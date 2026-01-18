import { Injectable } from '@nestjs/common';
import { ProjectService } from '../project/project.service';
import { ProjectInput } from '../types/tools';
import * as crypto from 'crypto';

@Injectable()
export class ProjectTool {
  constructor(private readonly projectService: ProjectService) {}

  async execute(input: ProjectInput) {
    // Validate project name
    if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
      throw new Error('Project name must be a non-empty string');
    }

    // Validate project path
    if (!input.path || typeof input.path !== 'string' || input.path.trim().length === 0) {
      throw new Error('Project path must be a non-empty string');
    }

    // Validate dependencies format
    if (!input.dependencies || typeof input.dependencies !== 'object') {
      throw new Error('Dependencies must be an object (e.g., {"react": "18.2.0"})');
    }

    // Validate individual dependency entries
    for (const [pkg, ver] of Object.entries(input.dependencies)) {
      if (typeof pkg !== 'string' || pkg.trim().length === 0) {
        throw new Error(`Invalid package name: "${pkg}" must be a non-empty string`);
      }
      if (typeof ver !== 'string' || ver.trim().length === 0) {
        throw new Error(`Invalid version for package "${pkg}": must be a non-empty string`);
      }
    }

    try {
      // Generate stable ID from path (trimmed for consistency)
      const id = crypto.createHash('md5').update(input.path.trim()).digest('hex');
      
      await this.projectService.createProject(
        id,
        input.name.trim(),
        input.path.trim(),
        input.dependencies,
        input.ecosystem?.trim() || 'npm'
      );

      return {
        status: 'success',
        projectId: id,
        message: `Project "${input.name}" configured with ${Object.keys(input.dependencies).length} dependencies.`
      };
    } catch (e) {
      throw new Error(`Failed to configure project: ${e.message}`);
    }
  }
}

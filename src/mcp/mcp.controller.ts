import { Controller, Get, Post, Res, Body, Query, Req } from '@nestjs/common';
import { McpService } from './mcp.service';
import { Response, Request } from 'express';

@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Get('sse')
  async sse(@Res() res: Response) {
    await this.mcpService.handleSseConnection(res);
  }

  @Post('messages')
  async messages(
    @Query('sessionId') sessionId: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    await this.mcpService.handleSseMessage(sessionId, body, res);
  }
}

import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DocumentSignaturesService, SignerRole } from './document-signatures.service';

@ApiTags('Document Signatures (Aturan Tanda Tangan Dokumen)')
@Controller('document-signatures')
export class DocumentSignaturesController {
  constructor(private readonly service: DocumentSignaturesService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Daftar peran penandatangan yang tersedia' })
  getRoles() {
    return this.service.getRoles();
  }

  @Get('rules')
  @ApiOperation({ summary: 'Daftar aturan tanda tangan per jenis dokumen (Super Admin)' })
  getRules() {
    return this.service.getRules();
  }

  @Post('rules')
  @ApiOperation({ summary: 'Menyimpan/memperbarui aturan tanda tangan sebuah jenis dokumen (Super Admin)' })
  upsertRule(
    @Body()
    body: {
      documentCode: string;
      documentLabel: string;
      signer1Role: SignerRole;
      signer1Label?: string;
      signer2Role?: SignerRole | null;
      signer2Label?: string;
      notes?: string;
    },
  ) {
    return this.service.upsertRule(body);
  }

  @Delete('rules/:documentCode')
  @ApiOperation({ summary: 'Menghapus aturan tanda tangan sebuah jenis dokumen (Super Admin)' })
  deleteRule(@Param('documentCode') documentCode: string) {
    return this.service.deleteRule(documentCode);
  }

  @Get('resolve')
  @ApiOperation({ summary: 'Resolusi nama & jabatan penandatangan nyata untuk sebuah dokumen & mahasiswa' })
  resolve(@Query('documentCode') documentCode: string, @Query('studentId') studentId?: string) {
    return this.service.resolveSigners(documentCode, studentId);
  }
}

import { IsOptional, IsString } from 'class-validator';

export class PublicNoticeDto {
    @IsOptional()
    @IsString()
    noticetype?: string;

    @IsOptional()
    @IsString()
    issuingAuthority?: string;

    @IsOptional()
    @IsString()
    detailedNotice?: string;

    @IsOptional()
    @IsString()
    pdf?: string;
}
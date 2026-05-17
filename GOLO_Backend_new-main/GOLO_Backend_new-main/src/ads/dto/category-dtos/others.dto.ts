import { IsOptional, IsString } from 'class-validator';

export class OthersDto {
    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    additionalInfo?: string;

    @IsOptional()
    @IsString()
    contactName?: string;
}
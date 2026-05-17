import { IsOptional, IsString } from 'class-validator';

export class GreetingsDto {
    @IsOptional()
    @IsString()
    noticeType?: string; // 'greetings' or 'tribute'

    // Greetings tab fields
    @IsOptional()
    @IsString()
    relationType?: string; // friend, brother, sister, relative, parent, colleague, other

    @IsOptional()
    @IsString()
    name?: string; // Name of person for greetings

    @IsOptional()
    @IsString()
    age?: string; // Age turning

    @IsOptional()
    @IsString()
    year?: string; // Date of birthday

    @IsOptional()
    @IsString()
    wishes?: string; // Your message/wishes

    @IsOptional()
    @IsString()
    from?: string; // From (sender's name)

    // Tribute tab fields
    @IsOptional()
    @IsString()
    name2?: string; // Full name of deceased

    @IsOptional()
    @IsString()
    age2?: string; // Age of deceased

    @IsOptional()
    @IsString()
    year2?: string; // Date of birth of deceased

    @IsOptional()
    @IsString()
    summary?: string; // Short biography / life summary

    @IsOptional()
    @IsString()
    funeralDetails?: string; // Funeral/prayer meeting details

    // Legacy fields for backward compatibility
    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    @IsString()
    senderName?: string;

    @IsOptional()
    @IsString()
    occasion?: string;
}
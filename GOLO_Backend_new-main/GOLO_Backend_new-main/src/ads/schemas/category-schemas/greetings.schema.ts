import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GreetingsDocument = Greetings & Document;

@Schema({ _id: false, timestamps: false })
export class Greetings {
  @Prop()
  noticeType?: string; // 'greetings' or 'tribute'

  // Greetings tab fields
  @Prop()
  relationType?: string; // friend, brother, sister, relative, parent, colleague, other

  @Prop()
  name?: string; // Name of person for greetings

  @Prop()
  age?: string; // Age turning

  @Prop()
  year?: string; // Date of birthday

  @Prop()
  wishes?: string; // Your message/wishes

  @Prop()
  from?: string; // From (sender's name)

  // Tribute tab fields
  @Prop()
  name2?: string; // Full name of deceased

  @Prop()
  age2?: string; // Age of deceased

  @Prop()
  year2?: string; // Date of birth of deceased

  @Prop()
  summary?: string; // Short biography / life summary

  @Prop()
  funeralDetails?: string; // Funeral/prayer meeting details

  // Legacy fields for backward compatibility
  @Prop()
  message?: string;

  @Prop()
  senderName?: string;

  @Prop()
  occasion?: string;
}

export const GreetingsSchema = SchemaFactory.createForClass(Greetings);

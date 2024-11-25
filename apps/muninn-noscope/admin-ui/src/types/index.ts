export interface Task {
  id: string;
  object_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface Object {
  id: string;
  created_at: string;
  last_synced_at?: string;
}

export interface ListObjectsRow {
  id: any;
  name: string;
  idString: string;
  description: string;
  aliases: string[];
  tags: any[];
  createdAt: string;
  updatedAt: string;
  typeValues: ObjectTypeValue[];

  searchRank: number;
  matchSource: string;
  objHeadline: string;
  typeValueHeadline: string;
  factHeadline: string;
}

export interface ObjectTypeValue {
  id: any;
  objectTypeId: any;
  type_values: { [key: string]: any };
}

export interface ObjectDetail {
  id: any;
  name: string;
  description: string;
  idString: string;
  aliases: string[];
  tags: any[];
  tasks: any[];
  createdAt: string;
  updatedAt: string;
  types: any[];
  typeValues: ObjectTypeValue[];
  stepsAndFunnels: any[];
}

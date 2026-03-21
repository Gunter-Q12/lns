export type Node = {
  data: {
    id: string;
    name?: string;
    parent?: string;
    matcher?: string;
    action?: string;
    [key: string]: any;
  };
  position?: {
    x: number;
    y: number;
  }
}

export type Edge = {
  id: string;
  source: string;
  target: string;
}

export type Graph = Array<Node|Edge>

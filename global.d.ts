declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.css?*" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*/DiscussionRoom" {
  import { FC } from "react";
  interface DiscussionRoomProps {
    postId: string;
    onClose: () => void;
    comments: any[];
  }
  const DiscussionRoom: FC<DiscussionRoomProps>;
  export default DiscussionRoom;
}

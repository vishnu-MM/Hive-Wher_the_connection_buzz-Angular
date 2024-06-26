export enum BlockFilter { ALL='ALL', BLOCKED='BLOCKED', NON_BLOCKED='NON_BLOCKED' }
export enum TimeFilter { ALL='ALL', TODAY='TODAY',THIS_WEEK='THIS_WEEK', THIS_MONTH='THIS_MONTH', THIS_YEAR='THIS_YEAR', CUSTOM_DATE='CUSTOM_DATE' }
export enum PostTypeFilter { ALL='ALL', IMAGE_BASED='IMAGE_BASED', VIDEO_BASED='VIDEO_BASED', TEXT_BASED='TEXT_BASED' }
export interface UserFilter {
    block: BlockFilter;
    time: TimeFilter;
    startingDate?: Date;
    endingDate?: Date;
    pageNo: number;
    pageSize: number;
}
export interface PostFilter {
    // block: BlockFilter;
    time: TimeFilter;
    postFile: PostTypeFilter;
    startingDate?: Date;
    endingDate?: Date;
    pageNo: number;
    pageSize: number;
}
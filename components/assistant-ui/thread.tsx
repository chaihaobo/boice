import {
    ArrowDownIcon,
    ArrowUpIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CopyIcon,
    PencilIcon,
    PlusIcon,
    RefreshCwIcon,
    Square,
} from "lucide-react";

import {
    ActionBarPrimitive,
    BranchPickerPrimitive,
    ComposerPrimitive,
    ErrorPrimitive,
    MessagePrimitive,
    ThreadPrimitive, useAssistantEvent,
    useAssistantRuntime,
} from "@assistant-ui/react";

import type {FC} from "react";
import {useTranslation} from "react-i18next";

import {Button} from "@/components/ui/button";
import {MarkdownText} from "@/components/assistant-ui/markdown-text";
import {ToolFallback} from "@/components/assistant-ui/tool-fallback";
import {TooltipIconButton} from "@/components/assistant-ui/tooltip-icon-button";
import {
    ComposerAddAttachment,
    ComposerAttachments,
    UserMessageAttachments,
} from "@/components/assistant-ui/attachment";

import {cn} from "@/lib/utils";
import {Reasoning, ReasoningGroup} from "@/components/assistant-ui/reasoning";

interface ThreadProps {
    showHeader?: boolean;
}

export const Thread: FC<ThreadProps> = ({showHeader = true}) => {
    return (
        <ThreadPrimitive.Root
            className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
            style={{
                ["--thread-max-width" as string]: "44rem",
            }}
        >
            {showHeader && <ThreadHeader/>}
            <ThreadPrimitive.Viewport
                autoScroll={true}
                className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-4"
            >
                <ThreadPrimitive.If empty>
                    <ThreadWelcome/>
                </ThreadPrimitive.If>

                <ThreadPrimitive.Messages
                    components={{
                        UserMessage,
                        EditComposer,
                        AssistantMessage,
                    }}
                />

                {/* Spacer to prevent content from being hidden behind the fixed composer */}
                <div className="h-4"/>
            </ThreadPrimitive.Viewport>

            {/* Fixed footer outside viewport */}
            <div
                className="aui-thread-footer relative mx-auto flex w-full max-w-(--thread-max-width) flex-col gap-4 bg-background px-4 pb-4 md:pb-6">
                <ThreadScrollToBottom/>
                <Composer/>
            </div>
        </ThreadPrimitive.Root>
    );
};

const ThreadHeader: FC = () => {
    const {t} = useTranslation();
    const runtime = useAssistantRuntime();

    const handleNewThread = () => {
        runtime.threadList.switchToNewThread();
    };

    return (
        <div className="aui-thread-header flex items-center justify-between border-b px-4 py-2">
            <span className="text-sm font-medium text-muted-foreground">
                {t("assistant.welcome_title")}
            </span>
            <TooltipIconButton
                tooltip={t("assistant.new_thread")}
                variant="ghost"
                size="sm"
                onClick={handleNewThread}
                className="h-8 w-8"
            >
                <PlusIcon className="h-4 w-4"/>
            </TooltipIconButton>
        </div>
    );
};

const ThreadScrollToBottom: FC = () => {
    const {t} = useTranslation();
    return (
        <ThreadPrimitive.ScrollToBottom asChild>
            <TooltipIconButton
                tooltip={t("assistant.scroll_to_bottom")}
                variant="outline"
                className="aui-thread-scroll-to-bottom absolute -top-10 left-1/2 -translate-x-1/2 z-10 rounded-full p-2 disabled:invisible dark:bg-background dark:hover:bg-accent"
            >
                <ArrowDownIcon className="size-4"/>
            </TooltipIconButton>
        </ThreadPrimitive.ScrollToBottom>
    );
};

const ThreadWelcome: FC = () => {
    const {t} = useTranslation();
    return (
        <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col">
            <div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
                <div className="aui-thread-welcome-message flex size-full flex-col justify-center px-4 sm:px-8">
                    <div
                        className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-2 animate-in font-semibold text-xl sm:text-2xl duration-300 ease-out">
                        {t("assistant.welcome_title")}
                    </div>
                    <div
                        className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-2 animate-in text-lg sm:text-2xl text-muted-foreground/65 delay-100 duration-300 ease-out">
                        {t("assistant.welcome_subtitle")}
                    </div>
                </div>
            </div>
            <ThreadSuggestions/>
        </div>
    );
};

const ThreadSuggestions: FC = () => {
    const {t} = useTranslation();
    const suggestions = [
        {
            title: t("assistant.suggestion_query_articles_title"),
            label: t("assistant.suggestion_query_articles_label"),
            action: t("assistant.suggestion_query_articles_action"),
            autoSend: true,
        },
        {
            title: t("assistant.suggestion_about_author_title"),
            label: t("assistant.suggestion_about_author_label"),
            action: t("assistant.suggestion_about_author_action"),
            autoSend: true,
        },
        {
            title: t("assistant.suggestion_scrape_title"),
            label: t("assistant.suggestion_scrape_label"),
            action: t("assistant.suggestion_scrape_action"),
            autoSend: false,
        },
        {
            title: t("assistant.suggestion_search_title"),
            label: t("assistant.suggestion_search_label"),
            action: t("assistant.suggestion_search_action"),
            autoSend: false,
        },
        {
            title: t("assistant.suggestion_time_title"),
            label: t("assistant.suggestion_time_label"),
            action: t("assistant.suggestion_time_action"),
            autoSend: true,
        },
        {
            title: t("assistant.suggestion_create_tag_title"),
            label: t("assistant.suggestion_create_tag_label"),
            action: t("assistant.suggestion_create_tag_action"),
            autoSend: false,
        },
        {
            title: t("assistant.suggestion_create_category_title"),
            label: t("assistant.suggestion_create_category_label"),
            action: t("assistant.suggestion_create_category_action"),
            autoSend: false,
        },
    ];
    return (
        <div className="aui-thread-welcome-suggestions grid w-full grid-cols-2 gap-1.5 sm:gap-2 pb-4 px-1">
            {suggestions.map((suggestedAction, index) => (
                <div
                    key={`suggested-action-${suggestedAction.title}-${index}`}
                    className="aui-thread-welcome-suggestion-display fade-in slide-in-from-bottom-4 animate-in fill-mode-both duration-300 ease-out"
                    style={{animationDelay: `${index * 50}ms`}}
                >
                    <ThreadPrimitive.Suggestion
                        prompt={suggestedAction.action}
                        send={suggestedAction.autoSend}
                        asChild
                    >
                        <Button
                            variant="ghost"
                            className="aui-thread-welcome-suggestion h-auto w-full flex-col items-start justify-start gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl border px-2.5 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm dark:hover:bg-accent/60"
                            aria-label={suggestedAction.action}
                        >
                            <span className="aui-thread-welcome-suggestion-text-1 font-medium line-clamp-1">
                                {suggestedAction.title}
                            </span>
                            <span
                                className="aui-thread-welcome-suggestion-text-2 text-xs text-muted-foreground line-clamp-1 hidden sm:block">
                                {suggestedAction.label}
                            </span>
                        </Button>
                    </ThreadPrimitive.Suggestion>
                </div>
            ))}
        </div>
    );
};

const Composer: FC = () => {
    const {t} = useTranslation();
    useAssistantEvent("composer.send", (event) => {
        console.log("Current composer sent message:", event);
    });
    return (
        <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
            <ComposerPrimitive.AttachmentDropzone
                className="aui-composer-attachment-dropzone flex w-full flex-col rounded-2xl sm:rounded-3xl border border-input bg-background px-1 pt-1.5 sm:pt-2 shadow-xs outline-none transition-[color,box-shadow] has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-[3px] has-[textarea:focus-visible]:ring-ring/50 data-[dragging=true]:border-ring data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50 dark:bg-background">
                <ComposerAttachments/>
                <ComposerPrimitive.Input
                    placeholder={t("assistant.input_placeholder")}
                    className="aui-composer-input mb-1 max-h-32 min-h-12 sm:min-h-16 w-full resize-none bg-transparent px-3 sm:px-3.5 pt-1 sm:pt-1.5 pb-2 sm:pb-3 text-sm sm:text-base outline-none placeholder:text-muted-foreground focus-visible:ring-0"
                    rows={1}
                    autoFocus
                    aria-label={t("assistant.input_placeholder")}
                />
                <ComposerAction/>
            </ComposerPrimitive.AttachmentDropzone>
        </ComposerPrimitive.Root>
    );
};

const ComposerAction: FC = () => {
    const {t} = useTranslation();
    return (
        <div className="aui-composer-action-wrapper relative mx-1 mt-2 mb-2 flex items-center justify-between">
            <ComposerAddAttachment/>

            <ThreadPrimitive.If running={false}>
                <ComposerPrimitive.Send asChild>
                    <TooltipIconButton
                        tooltip={t("assistant.send")}
                        side="bottom"
                        type="submit"
                        variant="default"
                        size="icon"
                        className="aui-composer-send size-[34px] rounded-full p-1"
                        aria-label={t("assistant.send")}
                    >
                        <ArrowUpIcon className="aui-composer-send-icon size-5"/>
                    </TooltipIconButton>
                </ComposerPrimitive.Send>
            </ThreadPrimitive.If>

            <ThreadPrimitive.If running>
                <ComposerPrimitive.Cancel asChild>
                    <Button
                        type="button"
                        variant="default"
                        size="icon"
                        className="aui-composer-cancel size-[34px] rounded-full border border-muted-foreground/60 hover:bg-primary/75 dark:border-muted-foreground/90"
                        aria-label={t("assistant.stop")}
                    >
                        <Square className="aui-composer-cancel-icon size-3.5 fill-white dark:fill-black"/>
                    </Button>
                </ComposerPrimitive.Cancel>
            </ThreadPrimitive.If>
        </div>
    );
};

const MessageError: FC = () => {
    return (
        <MessagePrimitive.Error>
            <ErrorPrimitive.Root
                className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
                <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2"/>
            </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
    );
};

const AssistantMessage: FC = () => {
    return (
        <MessagePrimitive.Root
            className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-4 duration-150 ease-out"
            data-role="assistant"
        >
            <div className="aui-assistant-message-content wrap-break-word mx-2 text-foreground leading-7 ">
                <MessagePrimitive.Parts
                    components={{
                        Reasoning: Reasoning,
                        ReasoningGroup: ReasoningGroup,
                        Text: MarkdownText,
                        tools: {Fallback: ToolFallback},
                    }}
                />
                <MessageError/>
            </div>

            <div className="aui-assistant-message-footer mt-2 ml-2 flex">
                <BranchPicker/>
                <AssistantActionBar/>
            </div>
        </MessagePrimitive.Root>
    );
};

const AssistantActionBar: FC = () => {
    const {t} = useTranslation();
    return (
        <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            autohideFloat="single-branch"
            className="aui-assistant-action-bar-root -ml-1 col-start-3 row-start-2 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm"
        >
            <ActionBarPrimitive.Copy asChild>
                <TooltipIconButton tooltip={t("assistant.copy")}>
                    <MessagePrimitive.If copied>
                        <CheckIcon/>
                    </MessagePrimitive.If>
                    <MessagePrimitive.If copied={false}>
                        <CopyIcon/>
                    </MessagePrimitive.If>
                </TooltipIconButton>
            </ActionBarPrimitive.Copy>
            <ActionBarPrimitive.Reload asChild>
                <TooltipIconButton tooltip={t("assistant.refresh")}>
                    <RefreshCwIcon/>
                </TooltipIconButton>
            </ActionBarPrimitive.Reload>
        </ActionBarPrimitive.Root>
    );
};

const UserMessage: FC = () => {
    return (
        <MessagePrimitive.Root
            className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-4 duration-150 ease-out [&:where(>*)]:col-start-2"
            data-role="user"
        >
            <UserMessageAttachments/>

            <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
                <div
                    className="aui-user-message-content wrap-break-word rounded-3xl bg-muted px-5 py-2.5 text-foreground">
                    <MessagePrimitive.Parts/>
                </div>
                <div
                    className="aui-user-action-bar-wrapper -translate-x-full -translate-y-1/2 absolute top-1/2 left-0 pr-2">
                    <UserActionBar/>
                </div>
            </div>

            <BranchPicker className="aui-user-branch-picker -mr-1 col-span-full col-start-1 row-start-3 justify-end"/>
        </MessagePrimitive.Root>
    );
};

const UserActionBar: FC = () => {
    const {t} = useTranslation();
    return (
        <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            className="aui-user-action-bar-root flex flex-col items-end"
        >
            <ActionBarPrimitive.Edit asChild>
                <TooltipIconButton tooltip={t("assistant.edit")} className="aui-user-action-edit p-4">
                    <PencilIcon/>
                </TooltipIconButton>
            </ActionBarPrimitive.Edit>
        </ActionBarPrimitive.Root>
    );
};

const EditComposer: FC = () => {
    const {t} = useTranslation();
    return (
        <MessagePrimitive.Root
            className="aui-edit-composer-wrapper mx-auto flex w-full max-w-(--thread-max-width) flex-col gap-4 px-2">
            <ComposerPrimitive.Root
                className="aui-edit-composer-root ml-auto flex w-full max-w-7/8 flex-col rounded-xl bg-muted">
                <ComposerPrimitive.Input
                    className="aui-edit-composer-input flex min-h-[60px] w-full resize-none bg-transparent p-4 text-foreground outline-none"
                    autoFocus
                />

                <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center justify-center gap-2 self-end">
                    <ComposerPrimitive.Cancel asChild>
                        <Button variant="ghost" size="sm" aria-label={t("assistant.cancel")}>
                            {t("assistant.cancel")}
                        </Button>
                    </ComposerPrimitive.Cancel>
                    <ComposerPrimitive.Send asChild>
                        <Button size="sm" aria-label={t("assistant.update")}>
                            {t("assistant.update")}
                        </Button>
                    </ComposerPrimitive.Send>
                </div>
            </ComposerPrimitive.Root>
        </MessagePrimitive.Root>
    );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
                                                                className,
                                                                ...rest
                                                            }) => {
    const {t} = useTranslation();
    return (
        <BranchPickerPrimitive.Root
            hideWhenSingleBranch
            className={cn(
                "aui-branch-picker-root -ml-2 mr-2 inline-flex items-center text-muted-foreground text-xs",
                className,
            )}
            {...rest}
        >
            <BranchPickerPrimitive.Previous asChild>
                <TooltipIconButton tooltip={t("assistant.previous")}>
                    <ChevronLeftIcon/>
                </TooltipIconButton>
            </BranchPickerPrimitive.Previous>
            <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number/> / <BranchPickerPrimitive.Count/>
      </span>
            <BranchPickerPrimitive.Next asChild>
                <TooltipIconButton tooltip={t("assistant.next")}>
                    <ChevronRightIcon/>
                </TooltipIconButton>
            </BranchPickerPrimitive.Next>
        </BranchPickerPrimitive.Root>
    );
};
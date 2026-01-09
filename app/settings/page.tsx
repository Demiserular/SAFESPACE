'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    Bell,
    Shield,
    User,
    Palette,
    Mail,
    MessageSquare,
    Eye,
    EyeOff,
    Save
} from 'lucide-react';
import Link from 'next/link';

interface UserSettings {
    // Notification Preferences
    emailNotifications: boolean;
    postReplies: boolean;
    commentReplies: boolean;
    newFollowers: boolean;
    weeklyDigest: boolean;

    // Privacy Settings
    showEmail: boolean;
    showProfile: boolean;
    allowDirectMessages: boolean;

    // Display Preferences
    postsPerPage: string;
    defaultPostView: string;
    autoPlayMedia: boolean;

    // Account Preferences
    defaultAnonymous: boolean;
    contentWarnings: boolean;
}

export default function SettingsPage() {
    const { user, loading } = useSupabaseAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    // Initialize settings with default values
    const [settings, setSettings] = useState<UserSettings>({
        // Notification Preferences
        emailNotifications: true,
        postReplies: true,
        commentReplies: true,
        newFollowers: false,
        weeklyDigest: false,

        // Privacy Settings
        showEmail: false,
        showProfile: true,
        allowDirectMessages: true,

        // Display Preferences
        postsPerPage: '10',
        defaultPostView: 'latest',
        autoPlayMedia: false,

        // Account Preferences
        defaultAnonymous: false,
        contentWarnings: true,
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }

        // Load settings from localStorage
        if (user) {
            const savedSettings = localStorage.getItem(`settings_${user.id}`);
            if (savedSettings) {
                try {
                    setSettings(JSON.parse(savedSettings));
                } catch (e) {
                    console.error('Error loading settings:', e);
                }
            }
        }
    }, [user, loading, router]);

    const handleSettingChange = (key: keyof UserSettings, value: boolean | string) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSaveSettings = async () => {
        if (!user) return;

        setSaving(true);
        try {
            // Save to localStorage (in production, you'd save to database)
            localStorage.setItem(`settings_${user.id}`, JSON.stringify(settings));

            toast({
                title: "Settings saved",
                description: "Your preferences have been updated successfully.",
            });
        } catch (error) {
            toast({
                title: "Error saving settings",
                description: "There was a problem saving your preferences. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <Link href="/profile">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your account preferences and settings</p>
                </div>
            </div>

            <Tabs defaultValue="notifications" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Privacy</span>
                    </TabsTrigger>
                    <TabsTrigger value="display" className="gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="hidden sm:inline">Display</span>
                    </TabsTrigger>
                    <TabsTrigger value="account" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Account</span>
                    </TabsTrigger>
                </TabsList>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notification Preferences
                            </CardTitle>
                            <CardDescription>
                                Choose what notifications you want to receive
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="email-notifications" className="text-base flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email Notifications
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive email notifications about your activity
                                    </p>
                                </div>
                                <Switch
                                    id="email-notifications"
                                    checked={settings.emailNotifications}
                                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="post-replies" className="text-base flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Post Replies
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when someone replies to your posts
                                    </p>
                                </div>
                                <Switch
                                    id="post-replies"
                                    checked={settings.postReplies}
                                    onCheckedChange={(checked) => handleSettingChange('postReplies', checked)}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="comment-replies" className="text-base">
                                        Comment Replies
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get notified when someone replies to your comments
                                    </p>
                                </div>
                                <Switch
                                    id="comment-replies"
                                    checked={settings.commentReplies}
                                    onCheckedChange={(checked) => handleSettingChange('commentReplies', checked)}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="weekly-digest" className="text-base">
                                        Weekly Digest
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive a weekly summary of community activity
                                    </p>
                                </div>
                                <Switch
                                    id="weekly-digest"
                                    checked={settings.weeklyDigest}
                                    onCheckedChange={(checked) => handleSettingChange('weeklyDigest', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Privacy Tab */}
                <TabsContent value="privacy" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Privacy & Security
                            </CardTitle>
                            <CardDescription>
                                Control who can see your information and contact you
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="show-email" className="text-base flex items-center gap-2">
                                        {settings.showEmail ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        Show Email Address
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Display your email address on your profile
                                    </p>
                                </div>
                                <Switch
                                    id="show-email"
                                    checked={settings.showEmail}
                                    onCheckedChange={(checked) => handleSettingChange('showEmail', checked)}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="show-profile" className="text-base">
                                        Public Profile
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow others to view your profile and activity
                                    </p>
                                </div>
                                <Switch
                                    id="show-profile"
                                    checked={settings.showProfile}
                                    onCheckedChange={(checked) => handleSettingChange('showProfile', checked)}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="allow-dm" className="text-base">
                                        Direct Messages
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow other users to send you direct messages
                                    </p>
                                </div>
                                <Switch
                                    id="allow-dm"
                                    checked={settings.allowDirectMessages}
                                    onCheckedChange={(checked) => handleSettingChange('allowDirectMessages', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Display Tab */}
                <TabsContent value="display" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Display Preferences
                            </CardTitle>
                            <CardDescription>
                                Customize how content appears to you
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="posts-per-page" className="text-base">
                                    Posts Per Page
                                </Label>
                                <Select
                                    value={settings.postsPerPage}
                                    onValueChange={(value) => handleSettingChange('postsPerPage', value)}
                                >
                                    <SelectTrigger id="posts-per-page">
                                        <SelectValue placeholder="Select posts per page" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 posts</SelectItem>
                                        <SelectItem value="10">10 posts</SelectItem>
                                        <SelectItem value="20">20 posts</SelectItem>
                                        <SelectItem value="50">50 posts</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    Number of posts to display per page
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="default-view" className="text-base">
                                    Default Post View
                                </Label>
                                <Select
                                    value={settings.defaultPostView}
                                    onValueChange={(value) => handleSettingChange('defaultPostView', value)}
                                >
                                    <SelectTrigger id="default-view">
                                        <SelectValue placeholder="Select default view" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="latest">Latest First</SelectItem>
                                        <SelectItem value="popular">Most Popular</SelectItem>
                                        <SelectItem value="oldest">Oldest First</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    How posts are sorted by default
                                </p>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="auto-play" className="text-base">
                                        Auto-play Media
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically play videos and GIFs in posts
                                    </p>
                                </div>
                                <Switch
                                    id="auto-play"
                                    checked={settings.autoPlayMedia}
                                    onCheckedChange={(checked) => handleSettingChange('autoPlayMedia', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Account Tab */}
                <TabsContent value="account" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Account Preferences
                            </CardTitle>
                            <CardDescription>
                                Manage your account settings and posting preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="default-anonymous" className="text-base">
                                        Post Anonymously by Default
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically select anonymous mode when creating posts
                                    </p>
                                </div>
                                <Switch
                                    id="default-anonymous"
                                    checked={settings.defaultAnonymous}
                                    onCheckedChange={(checked) => handleSettingChange('defaultAnonymous', checked)}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="content-warnings" className="text-base">
                                        Show Content Warnings
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Display warnings for sensitive content before viewing
                                    </p>
                                </div>
                                <Switch
                                    id="content-warnings"
                                    checked={settings.contentWarnings}
                                    onCheckedChange={(checked) => handleSettingChange('contentWarnings', checked)}
                                />
                            </div>

                            <Separator />

                            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                                <h4 className="font-medium text-yellow-600 dark:text-yellow-500 mb-2">Account Information</h4>
                                <div className="space-y-2 text-sm">
                                    <p className="text-muted-foreground">
                                        <span className="font-medium">Email:</span> {user?.email}
                                    </p>
                                    <p className="text-muted-foreground">
                                        <span className="font-medium">Member Since:</span> {new Date(user?.created_at || '').toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-6">
                <Link href="/profile">
                    <Button variant="outline">Cancel</Button>
                </Link>
                <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}

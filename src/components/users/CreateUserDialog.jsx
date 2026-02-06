"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { ImageField } from "../images/ImagePickerDialog";
import { toast } from "react-toastify";
import { useCurrentUser } from "@/hooks/use-currentuser";

export default function UserDialog({
  userCard,
  open,
  onOpenChange,
  roles = [],
  user = null, // if set → edit mode
  onCreated,
  onEdited,
}) {
  const isEdit = !!user;

  const { data: currentUser } = useCurrentUser();

  // console.log(currentUser);

  const defaultSocial = [
    { platform: "youtube", url: "" },
    { platform: "instagram", url: "" },
    { platform: "facebook", url: "" },
    { platform: "website", url: "" },
  ];

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    profileImg: "",
    bio: "",
    location: "",
    backgroundImg: "",
    social: defaultSocial,
    roleId: "",
    status: "active",
  });

  // Reset or prefill form
  React.useEffect(() => {
    if (open) {
      if (isEdit && user) {
        setForm({
          name: user.name || "",
          email: user.email || "",
          profileImg: user.profileImg || "",
          bio: user.bio || "",
          location: user.location || "",
          backgroundImg: user.backgroundImg || "",
          social: defaultSocial.map((s) => {
            const found = user.social?.find((u) => u.platform === s.platform);
            return found || { ...s };
          }),
          roleId: String(user.roleId || ""),
          status: user.status || "active",
        });
      } else {
        reset();
      }
    }
  }, [open, user]);

  const reset = () =>
    setForm({
      name: "",
      email: "",
      profileImg: "",
      bio: "",
      location: "",
      backgroundImg: "",
      social: defaultSocial,
      roleId: "",
      status: "active",
    });

  const updateField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Create mutation
  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      };

      if (!payload.roleId) delete payload.roleId;

      const { data } = await api().post("/api/users", payload);
      return data;
    },
    onSuccess: (data) => {
      onCreated?.(data);
      onOpenChange?.(false);
      toast.success("User created successfully");
      reset();
    },
    onError: (e) => toast.error(e?.message || "Failed to create user"),
  });

  // Edit mutation
  const edit = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      };

      if (!payload.roleId) delete payload.roleId;

      const id = user?._id || user?.id;
      if (!id) throw new Error("User id is missing for update");
      const { data } = userCard
        ? await api().patch(`/api/users/${id}`, payload)
        : await api().put(`/api/users/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      onEdited?.(data);
      onOpenChange?.(false);
      toast.success("User updated successfully");
      reset();
    },
    onError: (e) => toast.error(e?.message || "Failed to update user"),
  });

  const canSave =
    form.name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    !!form.roleId;

  const isPending = create.isPending || edit.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-[95%] p-0 border border-gray-300 dark:border-gray-800">
        <DialogHeader className={"p-6 pb-0"}>
          <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain custom-y-scroll pr-1">
          <div className="p-6 flex flex-col gap-4">
            {/* Name */}
            <div className="space-y-1.5 ">
              <Label htmlFor="u-name">
                Name{" "}
                <span className="text-sm opacity-80 text-red-500">
                  (required)
                </span>
              </Label>
              <Input
                id="u-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., Rishabh Sharma"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="u-email">
                Email{" "}
                <span className="text-sm opacity-80 text-red-500">
                  (required)
                </span>
              </Label>
              <Input
                id="u-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="name@example.com"
                disabled={isEdit}
              />
            </div>

            {/* Role */}
            {(currentUser?.roleName.toLowerCase() === "admin" ||
              currentUser?.roleName.toLowerCase() === "developer" ||
              currentUser?.roleName.toLowerCase() === "dev") && (
              <div className="space-y-1.5">
                <Label>
                  Role{" "}
                  <span className="text-sm opacity-80 text-red-500">
                    (required)
                  </span>
                </Label>
                <Select
                  value={form.roleId || undefined}
                  onValueChange={(v) => updateField("roleId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="border-0">
                    {roles.map((r) => (
                      <SelectItem
                        key={r._id || r.id}
                        value={String(r._id || r.id)}
                      >
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Profile Image */}
            <div className="space-y-1.5">
              <Label htmlFor="u-img">Profile Image URL</Label>
              <ImageField
                value={form.profileImg}
                onChange={(v) => updateField("profileImg", v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-img">Background Image URL</Label>
              <ImageField
                value={form.backgroundImg}
                onChange={(v) => updateField("backgroundImg", v)}
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="u-bio">Bio</Label>
              <Textarea
                id="u-bio"
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Short description..."
                rows={3}
              />
            </div>

            {/* Social */}
            <div className="space-y-1.5">
              <Label>Social</Label>
              <div className="flex flex-col">
                {form.social.map((s, idx) => (
                  <Input
                    key={s.platform}
                    value={s.url}
                    placeholder={`${
                      s.platform.charAt(0).toUpperCase() + s.platform.slice(1)
                    } URL`}
                    onChange={(e) => {
                      const next = [...form.social];
                      next[idx] = { ...next[idx], url: e.target.value };
                      updateField("social", next);
                    }}
                    className="mb-2"
                  />
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="u-location">Location</Label>
              <Input
                id="u-location"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="City, Country"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => updateField("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex justify-end items-center gap-3 p-6 pt-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => (isEdit ? edit.mutate() : create.mutate())}
            disabled={!canSave || isPending}
            className="gap-1"
          >
            {isPending
              ? isEdit
                ? "Updating…"
                : "Creating…"
              : isEdit
              ? "Update"
              : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

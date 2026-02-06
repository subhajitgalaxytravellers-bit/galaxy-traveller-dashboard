import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TextField from "@/components/fields/TextField";
import RelationInput from "@/components/fields/RelationInput";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ImageField } from "@/components/images/ImagePickerDialog";
import api from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import TextAreaField from "../fields/TextAreaField";

export default function FlyerFormDialog({ open, onClose, flyerId, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    image: "",
    description: "",
    type: "destination",
    destination: null,
    tour: null,
    status: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [options, setOptions] = useState({
    tour: [],
    destination: [],
  });

  // -------- LOAD FORM WHEN EDITING ----------
  useEffect(() => {
    if (!open) return;
    if (!flyerId || flyerId === "new") return;

    setLoading(true);

    api()
      .get(`/api/flyers/moderation/${flyerId}`)
      .then((res) => {
        const data = res.data.data;
        setForm({
          title: data.title || "",
          image: data.image || "",
          description: data.description || "",
          type: data.type || "destination",
          destination: data.destination?._id || data.destination || null,
          tour: data.tour?._id || data.tour || null,

          status: data.status == "published" ? true : false,
        });
      })
      .finally(() => setLoading(false));
  }, [flyerId, open]);

  // -------- UPDATE FIELD --------
  const updateField = (key, value) => {
    // Hard reset the opposite relation when switching type
    console.log(key, value);
    if (key === "type") {
      setForm((prev) => ({
        ...prev,
        type: value,
        destination: value === "destination" ? prev.destination : null,
        tour: value === "tour" ? prev.tour : null,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // -------- SAVE --------
  const saveFlyer = async () => {
    if (!form.title.trim()) return alert("Title is required");
    setSaving(true);

    // Prevent sending both relation fields
    const payload = {
      ...form,
      destination: form.type === "destination" ? form.destination : null,
      tour: form.type === "tour" ? form.tour : null,
      status: form.status == true ? "published" : "draft",
    };

    try {
      if (flyerId === "new") {
        await api().post("/api/flyers/moderation", payload);
      } else {
        await api().put(`/api/flyers/moderation/${flyerId}`, payload);
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save flyer");
    } finally {
      setSaving(false);
    }
  };

  // -------- API HELPERS --------
  const fetchOne = async (type, id) => {
    if (!id) return null;
    try {
      const res = await api().get(`/api/${type}/${id}`);
      console.log(res.data);
      return res.data;
    } catch {
      return null;
    }
  };

  const fetchOptions = async (type, q = "") => {
    try {
      const res = await api().get(`/api/${type}`, {
        params: { q, limit: 20 },
      });
      console.log(res.data);
      return res.data.data.items || [];
    } catch {
      return [];
    }
  };

  // -------- LOAD SELECTED + OPTIONS --------
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const typeKey = form.type === "tour" ? "tour" : "destinations";
      const optionKey = form.type;

      const selectedId = form[optionKey]; // always an ID
      let selectedItem = null;

      if (selectedId) {
        selectedItem = await fetchOne(typeKey, selectedId);
      }

      const list = await fetchOptions(typeKey);

      let mergedList = list;

      // Ensure selected item appears in options
      if (selectedItem && !list.some((x) => x._id === selectedItem._id)) {
        mergedList = [selectedItem, ...list];
      }

      setOptions((prev) => ({
        ...prev,
        [optionKey]: mergedList,
      }));
    };

    load();
  }, [form.type, form.destination, form.tour, open]);

  return (
    <Dialog open={open} className="border-0" onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] border-gray-300 dark:border-gray-700 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {flyerId === "new" ? "Create Flyer" : "Edit Flyer"}
          </DialogTitle>
        </DialogHeader>

        <Separator />

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Title */}
            <TextField
              label="Title"
              placeholder="Flyer Title"
              value={form.title}
              onChange={(v) => updateField("title", v)}
              field={{ minLength: 3, maxLength: 100 }}
            />

            {/* Description */}
            <TextAreaField
              label="Description"
              value={form.description}
              onChange={(v) => updateField("description", v)}
              placeholder="Flyer Description"
              field={{ minLength: 3, maxLength: 200 }}
            />

            {/* Image */}
            <ImageField
              label="Image"
              value={form.image}
              onChange={(v) => updateField("image", v)}
              placeholder="Image URL"
              field={{ minLength: 3, maxLength: 200 }}
            />

            {/* LINK TYPE */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Link Type</label>
              <Select
                value={form.type}
                onValueChange={(v) => updateField("type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="destination">Destination</SelectItem>
                  <SelectItem value="tour">Tour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* RELATION INPUTS */}
            {form.type === "destination" && (
              <RelationInput
                label="Destination"
                value={form.destination} // ID only
                onChange={(field, v) => {
                  console.log(field, v);
                  updateField("destination", v);
                }}
                nameKey="title"
                options={options.destination}
                getOptions={() =>
                  fetchOptions("destinations").then((list) =>
                    setOptions((o) => ({ ...o, destination: list }))
                  )
                }
                searchOptions={(q) =>
                  fetchOptions("destinations", q).then((list) =>
                    setOptions((o) => ({ ...o, destination: list }))
                  )
                }
              />
            )}

            {form.type === "tour" && (
              <RelationInput
                label="Tour"
                value={form.tour}
                onChange={(field, v) => updateField("tour", v)}
                nameKey="title"
                options={options.tour}
                getOptions={() =>
                  fetchOptions("tour").then((list) =>
                    setOptions((o) => ({ ...o, tour: list }))
                  )
                }
                searchOptions={(q) =>
                  fetchOptions("tour", q).then((list) =>
                    setOptions((o) => ({ ...o, tour: list }))
                  )
                }
              />
            )}

            {/* STATUS */}
            <div className="flex items-center justify-between">
              <span>Published</span>
              <Switch
                checked={form.status}
                onCheckedChange={(v) => updateField("status", v)}
              />
            </div>
          </div>
        )}

        <Separator />

        <DialogFooter>
          <Button variant="outline" className="mr-2" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveFlyer} disabled={saving}>
            {saving ? "Saving..." : "Save Flyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

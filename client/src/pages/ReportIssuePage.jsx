import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ImagePlus,
  Info,
  Lightbulb,
  MapPin,
  Send,
  X,
} from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  RadioCards,
  Textarea,
} from '../components/ui';
import { LocationPicker } from '../components/map/LocationPicker';
import { categoryIcon } from '../components/issues/CategoryIcon';
import { useMeta } from '../context/MetaContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import api from '../lib/api';
import { STATUS_STYLES } from '../lib/constants';

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const EMPTY_FORM = {
  title: '',
  description: '',
  category: '',
  priority: 'medium',
  address: '',
  area: '',
  city: '',
  pincode: '',
};

const FIELD_LABELS = {
  title: 'Title',
  description: 'Description',
  category: 'Category',
  address: 'Address',
  location: 'Location pin',
  priority: 'Priority',
};

export default function ReportIssuePage() {
  useDocumentTitle('Report an Issue');

  const navigate = useNavigate();
  const toast = useToast();
  const { categories, priorities, statusFlow, statusLabel } = useMeta();

  const [form, setForm] = useState(EMPTY_FORM);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const previewsRef = useRef([]);

  // Keep the latest object URLs available to the unmount cleanup.
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(
    () => () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.value,
        label: category.label,
        description: category.department,
        icon: categoryIcon(category.value),
      })),
    [categories],
  );

  const priorityOptions = useMemo(
    () => priorities.map((priority) => ({ value: priority.value, label: priority.label })),
    [priorities],
  );

  const selectedDepartment = categories.find((category) => category.value === form.category)
    ?.department;

  const hasPoint = Number.isFinite(coords.lat) && Number.isFinite(coords.lng);

  const summary = useMemo(
    () =>
      Object.entries(errors)
        .filter(([, message]) => Boolean(message))
        .map(([key, message]) => ({
          key,
          label: FIELD_LABELS[key] || key,
          message,
        })),
    [errors],
  );

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`You can attach up to ${MAX_PHOTOS} photos.`, { title: 'Photo limit reached' });
      return;
    }

    const accepted = [];
    incoming.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`“${file.name}” is not an image file.`, { title: 'Unsupported file' });
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        toast.error(`“${file.name}” is larger than 5 MB.`, { title: 'Photo too large' });
        return;
      }
      accepted.push(file);
    });

    if (accepted.length > remaining) {
      toast.error(`Only the first ${remaining} photo(s) were added — the limit is ${MAX_PHOTOS}.`, {
        title: 'Photo limit reached',
      });
    }

    const trimmed = accepted.slice(0, remaining);
    if (!trimmed.length) return;

    const urls = trimmed.map((file) => URL.createObjectURL(file));
    setPhotos((current) => [...current, ...trimmed]);
    setPreviews((current) => [...current, ...urls]);
    setErrors((current) => ({ ...current, photos: undefined }));
  };

  const removePhoto = (index) => {
    const url = previews[index];
    if (url) URL.revokeObjectURL(url);
    setPhotos((current) => current.filter((_, position) => position !== index));
    setPreviews((current) => current.filter((_, position) => position !== index));
  };

  const validate = () => {
    const next = {};
    const title = form.title.trim();
    const description = form.description.trim();

    if (title.length < 5) next.title = 'Give your report a clear title (at least 5 characters).';
    else if (title.length > 140) next.title = 'Keep the title under 140 characters.';

    if (description.length < 10) next.description = 'Describe the issue in at least 10 characters.';
    else if (description.length > 2000) next.description = 'Keep the description under 2000 characters.';

    if (!form.category) next.category = 'Choose the category that fits best.';
    if (!form.address.trim()) next.address = 'Enter the street address of the issue.';
    if (!hasPoint) next.location = 'Drop a pin on the map to set the exact location.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      toast.error('Please fix the highlighted fields before submitting.', {
        title: 'Almost there',
      });
      return;
    }

    const payload = new FormData();
    payload.append('title', form.title.trim());
    payload.append('description', form.description.trim());
    payload.append('category', form.category);
    if (form.priority) payload.append('priority', form.priority);
    payload.append('address', form.address.trim());
    if (form.area.trim()) payload.append('area', form.area.trim());
    if (form.city.trim()) payload.append('city', form.city.trim());
    if (form.pincode.trim()) payload.append('pincode', form.pincode.trim());
    payload.append('lat', String(coords.lat));
    payload.append('lng', String(coords.lng));
    photos.forEach((file) => payload.append('photos', file));

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/issues', payload);
      toast.success(data.message || 'Complaint submitted successfully.', { title: 'Reported' });
      navigate(`/issues/${data.data.id}`);
    } catch (error) {
      const details = Array.isArray(error?.details) ? error.details : [];
      if (details.length) {
        const mapped = {};
        details.forEach((detail) => {
          const field = detail.field || detail.path;
          const message = detail.message || detail.msg;
          if (field && message) mapped[field] = message;
        });
        setErrors(mapped);
      }
      toast.error(error?.message || 'We could not submit your report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const flowSteps = Array.isArray(statusFlow) ? statusFlow : [];

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Report an issue</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
          Tell us what is wrong, attach a photo and drop a pin. We route it to the right
          municipal department and keep you posted.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} noValidate className="space-y-6 lg:col-span-2">
          {summary.length > 0 && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5"
            >
              <p className="flex items-center gap-2 text-sm font-bold text-rose-900">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                Please fix {summary.length} {summary.length === 1 ? 'field' : 'fields'} before
                submitting
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-1 text-sm text-rose-700">
                {summary.map((entry) => (
                  <li key={entry.key}>
                    <span className="font-semibold">{entry.label}:</span> {entry.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Card>
            <CardHeader
              title="Complaint details"
              description="A clear title and description help the field team act faster."
            />
            <CardBody className="space-y-5">
              <Field
                label="Title"
                htmlFor="report-title"
                error={errors.title}
                hint={`${form.title.length}/140 characters`}
                required
              >
                <Input
                  id="report-title"
                  type="text"
                  maxLength={140}
                  placeholder="e.g. Large pothole near the Sinhagad Road junction"
                  value={form.title}
                  onChange={(event) => update('title', event.target.value)}
                  invalid={Boolean(errors.title)}
                />
              </Field>

              <Field
                label="Description"
                htmlFor="report-description"
                error={errors.description}
                hint={`${form.description.length}/2000 characters`}
                required
              >
                <Textarea
                  id="report-description"
                  rows={6}
                  maxLength={2000}
                  placeholder="Describe the problem, how long it has been there and any landmarks that make it easy to find."
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                  invalid={Boolean(errors.description)}
                />
              </Field>

              <Field label="Category" error={errors.category} required>
                <RadioCards
                  name="report-category"
                  value={form.category}
                  onChange={(value) => update('category', value)}
                  options={categoryOptions}
                  columns={3}
                />
                {selectedDepartment && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-semibold text-primary-800">
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                    Routed to {selectedDepartment}
                  </p>
                )}
              </Field>

              <Field
                label="Priority"
                hint="The municipal team confirms the final priority based on severity."
              >
                <RadioCards
                  name="report-priority"
                  value={form.priority}
                  onChange={(value) => update('priority', value)}
                  options={priorityOptions}
                  columns={4}
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Photos"
              description="Optional, but a clear photo more than doubles the chance of a quick fix."
            />
            <CardBody>
              <label
                htmlFor="report-photos"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-8 text-center transition hover:border-primary-400 hover:bg-primary-50/40 focus-within:border-primary-400"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-primary-600 shadow-sm">
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="mt-3 text-sm font-semibold text-navy-900">
                  Add photos of the issue
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  PNG or JPG · up to 5 photos · max 5 MB each
                </span>
                <input
                  ref={fileInputRef}
                  id="report-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
              </label>

              {errors.photos && (
                <p className="field-error" role="alert">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {errors.photos}
                </p>
              )}

              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {previews.map((url, index) => (
                    <div
                      key={url}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={url}
                        alt={`Selected photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        aria-label={`Remove photo ${index + 1}`}
                        className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-lg bg-navy-900/70 text-white opacity-0 transition hover:bg-navy-900 group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-3 text-xs font-medium text-slate-500">
                {photos.length} of {MAX_PHOTOS} photos attached
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={MapPin}
              title="Location"
              description="Enter the address, then confirm the exact spot on the map."
            />
            <CardBody className="space-y-5">
              <Field label="Address" htmlFor="report-address" error={errors.address} required>
                <Input
                  id="report-address"
                  type="text"
                  placeholder="Street, building or landmark"
                  value={form.address}
                  onChange={(event) => update('address', event.target.value)}
                  invalid={Boolean(errors.address)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Area" htmlFor="report-area">
                  <Input
                    id="report-area"
                    type="text"
                    placeholder="Neighbourhood"
                    value={form.area}
                    onChange={(event) => update('area', event.target.value)}
                  />
                </Field>
                <Field label="City" htmlFor="report-city">
                  <Input
                    id="report-city"
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={(event) => update('city', event.target.value)}
                  />
                </Field>
                <Field label="Pincode" htmlFor="report-pincode">
                  <Input
                    id="report-pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="411030"
                    value={form.pincode}
                    onChange={(event) => update('pincode', event.target.value)}
                  />
                </Field>
              </div>

              <div>
                <LocationPicker value={coords} onChange={setCoords} />
                {errors.location && (
                  <p className="field-error" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {errors.location}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-slate-500">
              Your name and contact details are shared only with the handling department.
            </p>
            <Button
              type="submit"
              size="lg"
              leftIcon={Send}
              isLoading={isSubmitting}
              loadingText="Submitting your report…"
              className="w-full sm:w-auto"
            >
              Submit report
            </Button>
          </div>
        </form>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader icon={Lightbulb} title="Tips for a strong report" />
            <CardBody>
              <ul className="space-y-3 text-sm text-slate-600">
                {[
                  'Be specific — mention what is broken and for how long.',
                  'Add a photo; it is the fastest way to get verified.',
                  'Pin the exact spot so the crew finds it first time.',
                  'Mention nearby landmarks, shops or traffic signals.',
                ].map((tip) => (
                  <li key={tip} className="flex gap-2.5">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={Info} title="What happens next" />
            <CardBody>
              <ol className="space-y-3.5">
                {flowSteps.map((status, index) => {
                  const style = STATUS_STYLES[status];
                  return (
                    <li key={status} className="flex gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-navy-900">{statusLabel(status)}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                          {style?.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-700">
                If a complaint cannot be actioned it is marked{' '}
                <span className="font-bold">Rejected</span>, with the reason shown on the
                complaint.
              </p>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}

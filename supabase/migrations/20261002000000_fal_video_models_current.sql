-- Keep IA-67 video generation on current fal.ai endpoints.
-- Requires FAL_KEY as a server-side environment variable.

UPDATE public.video_models
SET provider = 'fal',
    label = 'Kling 3.0 Pro',
    model_id = 'fal-ai/kling-video/v3/pro/text-to-video'
WHERE family = 'kling' AND mode = 'text_to_video';

UPDATE public.video_models
SET provider = 'fal',
    label = 'Kling 3.0 Pro',
    model_id = 'fal-ai/kling-video/v3/pro/image-to-video'
WHERE family = 'kling' AND mode = 'image_to_video';

UPDATE public.video_models
SET provider = 'fal',
    label = 'Veo 3.1',
    model_id = 'fal-ai/veo3.1'
WHERE family = 'veo' AND mode = 'text_to_video';

UPDATE public.video_models
SET provider = 'fal',
    label = 'Veo 3.1',
    model_id = 'fal-ai/veo3.1/image-to-video'
WHERE family = 'veo' AND mode = 'image_to_video';

UPDATE public.video_models
SET provider = 'fal',
    label = 'Sora 2',
    model_id = 'fal-ai/sora-2/text-to-video'
WHERE family = 'sora' AND mode = 'text_to_video';

UPDATE public.video_models
SET provider = 'fal',
    label = 'Sora 2',
    model_id = 'fal-ai/sora-2/image-to-video'
WHERE family = 'sora' AND mode = 'image_to_video';

-- Add Wan 2.7 as a current fal.ai option when Wan is not already present.
INSERT INTO public.video_models
  (provider, family, label, model_id, mode, resolution, duration, aspect_ratios, credits_required, api_cost, sort_order)
SELECT 'fal', 'wan', 'Wan 2.7', 'fal-ai/wan/v2.7/text-to-video', 'text_to_video', '1080p', 5, ARRAY['16:9','9:16','1:1','4:3','3:4'], 15, 0.7500, 40
WHERE NOT EXISTS (
  SELECT 1 FROM public.video_models WHERE model_id = 'fal-ai/wan/v2.7/text-to-video'
);

INSERT INTO public.video_models
  (provider, family, label, model_id, mode, resolution, duration, aspect_ratios, credits_required, api_cost, sort_order)
SELECT 'fal', 'wan', 'Wan 2.7', 'fal-ai/wan/v2.7/image-to-video', 'image_to_video', '1080p', 5, ARRAY['16:9','9:16','1:1','4:3','3:4'], 15, 0.7500, 41
WHERE NOT EXISTS (
  SELECT 1 FROM public.video_models WHERE model_id = 'fal-ai/wan/v2.7/image-to-video'
);

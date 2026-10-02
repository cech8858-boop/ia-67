-- Switch Kling / Veo / Sora video generation to current fal.ai endpoints.
-- The previous APIDot model ids are retained only in old migration history.

UPDATE public.video_models
SET provider = 'fal',
    label = 'Kling 3.0 Pro',
    model_id = 'fal-ai/kling-video/v3/pro/image-to-video'
WHERE family = 'kling' AND mode = 'image_to_video';

INSERT INTO public.video_models
  (provider, family, label, model_id, mode, resolution, duration, aspect_ratios, credits_required, api_cost, sort_order)
SELECT 'fal', 'kling', 'Kling 3.0 Pro', 'fal-ai/kling-video/v3/pro/text-to-video', 'text_to_video', NULL, 5, ARRAY['16:9','9:16'], 20, 0.8400, 9
WHERE NOT EXISTS (
  SELECT 1 FROM public.video_models
  WHERE model_id = 'fal-ai/kling-video/v3/pro/text-to-video' AND mode = 'text_to_video'
);

UPDATE public.video_models
SET provider = 'fal',
    label = 'Veo 3.1',
    model_id = 'fal-ai/veo3.1'
WHERE family = 'veo' AND mode = 'text_to_video';

INSERT INTO public.video_models
  (provider, family, label, model_id, mode, resolution, duration, aspect_ratios, credits_required, api_cost, sort_order)
SELECT 'fal', 'veo', 'Veo 3.1', 'fal-ai/veo3.1/image-to-video', 'image_to_video', '720p', 8, ARRAY['16:9','9:16'], 20, 3.2000, 21
WHERE NOT EXISTS (
  SELECT 1 FROM public.video_models
  WHERE model_id = 'fal-ai/veo3.1/image-to-video' AND mode = 'image_to_video'
);

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

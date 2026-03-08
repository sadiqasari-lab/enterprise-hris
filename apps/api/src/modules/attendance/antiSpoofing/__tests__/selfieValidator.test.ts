import sharp from 'sharp';
import { SelfieValidator } from '../selfieValidator';

const createImageBase64 = async (
  width: number,
  height: number,
  format: 'jpeg' | 'png' = 'jpeg'
): Promise<string> => {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 120, b: 120 },
    },
  })
    .toFormat(format)
    .toBuffer();

  return `data:image/${format};base64,${buffer.toString('base64')}`;
};

describe('SelfieValidator', () => {
  const originalEnv = process.env.FACE_DETECTION_ENABLED;

  afterEach(() => {
    process.env.FACE_DETECTION_ENABLED = originalEnv;
    jest.restoreAllMocks();
  });

  it('valid selfie passes (no flags)', async () => {
    process.env.FACE_DETECTION_ENABLED = 'true';
    const validator = new SelfieValidator();

    const imageBase64 = await createImageBase64(640, 480, 'jpeg');

    jest
      .spyOn(SelfieValidator.prototype as any, 'detectFace')
      .mockResolvedValue({ detected: true, confidence: 0.9 });

    jest
      .spyOn(SelfieValidator.prototype as any, 'decodeBase64')
      .mockReturnValue(Buffer.alloc(50 * 1024));

    jest
      .spyOn(SelfieValidator.prototype as any, 'hasCameraMetadata')
      .mockReturnValue(true);

    jest
      .spyOn(SelfieValidator.prototype as any, 'extractMetadata')
      .mockResolvedValue({
        width: 480,
        height: 640,
        format: 'jpeg',
        exif: Buffer.from('camera'),
        orientation: 1,
        density: 72,
      });

    const result = await validator.validate(imageBase64, 'user-1', []);

    expect(result.isValid).toBe(true);
    expect(result.flags).toHaveLength(0);
    expect(result.requiresHRApproval).toBe(false);
  });

  it('invalid base64 format fails', async () => {
    const validator = new SelfieValidator();
    const result = await validator.validate('not-base64', 'user-1', []);

    expect(result.isValid).toBe(false);
    expect(result.flags).toContain('SELFIE_INVALID_FORMAT');
    expect(result.requiresHRApproval).toBe(true);
  });

  it('file too small triggers flag', async () => {
    process.env.FACE_DETECTION_ENABLED = 'true';
    const validator = new SelfieValidator();
    const imageBase64 = await createImageBase64(40, 40, 'jpeg');

    jest
      .spyOn(SelfieValidator.prototype as any, 'detectFace')
      .mockResolvedValue({ detected: true, confidence: 0.9 });

    const result = await validator.validate(imageBase64, 'user-1', []);

    expect(result.flags).toContain('SELFIE_FILE_TOO_SMALL');
  });

  it('face detection disabled triggers requiresHRApproval', async () => {
    process.env.FACE_DETECTION_ENABLED = 'false';
    const validator = new SelfieValidator();
    const imageBase64 = await createImageBase64(480, 640, 'jpeg');

    const result = await validator.validate(imageBase64, 'user-1', []);

    expect(result.flags).toContain('SELFIE_FACE_DETECTION_DISABLED');
    expect(result.requiresHRApproval).toBe(true);
  });

  it('processing error returns requiresHRApproval true', async () => {
    process.env.FACE_DETECTION_ENABLED = 'true';
    const validator = new SelfieValidator();
    const imageBase64 = await createImageBase64(480, 640, 'jpeg');

    jest
      .spyOn(SelfieValidator.prototype as any, 'extractMetadata')
      .mockRejectedValue(new Error('boom'));

    const result = await validator.validate(imageBase64, 'user-1', []);

    expect(result.isValid).toBe(false);
    expect(result.flags).toContain('SELFIE_PROCESSING_ERROR');
    expect(result.requiresHRApproval).toBe(true);
  });
});

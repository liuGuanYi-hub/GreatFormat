const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { ensureDirSync } = require('./utils');

class MediaEngine {
  static AUDIO_FORMATS = ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'opus', 'wma', 'ac3', 'aiff'];
  static VIDEO_FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'ts', '3gp'];
  static SPECIAL_IMAGE_FORMATS = ['heic', 'heif', 'tga'];

  static async convertAudio(inputPath, outputPath, options = {}) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`音频文件不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);
    const targetExt = path.extname(outputPath).slice(1).toLowerCase();

    let codecArgs = '';
    if (targetExt === 'mp3') codecArgs = '-c:a libmp3lame -q:a 2';
    else if (targetExt === 'aac' || targetExt === 'm4a') codecArgs = '-c:a aac -b:a 192k';
    else if (targetExt === 'flac') codecArgs = '-c:a flac';
    else if (targetExt === 'wav') codecArgs = '-c:a pcm_s16le';
    else if (targetExt === 'ogg') codecArgs = '-c:a libvorbis -q:a 5';
    else if (targetExt === 'opus') codecArgs = '-c:a libopus -b:a 128k';
    else if (targetExt === 'ac3') codecArgs = '-c:a ac3 -b:a 384k';

    const cmd = `ffmpeg -y -i "${resolvedInput}" ${codecArgs} "${resolvedOutput}"`;
    try {
      await execAsync(cmd);
      if (fs.existsSync(resolvedOutput)) {
        return {
          success: true,
          engine: 'FFmpeg Audio Transcoder',
          outputPath: resolvedOutput,
          size: fs.statSync(resolvedOutput).size
        };
      }
    } catch (err) {
      throw new Error(`音频转换失败: ${err.message}`);
    }
    throw new Error('音频转换未生成输出文件');
  }

  static async convertVideo(inputPath, outputPath, options = {}) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`视频文件不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);
    const targetExt = path.extname(outputPath).slice(1).toLowerCase();

    if (targetExt === 'gif') {
      const fps = options.fps || 12;
      const width = options.width || 480;
      const cmd = `ffmpeg -y -i "${resolvedInput}" -vf "fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${resolvedOutput}"`;
      try {
        await execAsync(cmd);
        if (fs.existsSync(resolvedOutput)) {
          return {
            success: true,
            engine: 'FFmpeg Video to High-Quality GIF',
            outputPath: resolvedOutput,
            size: fs.statSync(resolvedOutput).size
          };
        }
      } catch (err) {
        throw new Error(`视频转 GIF 失败: ${err.message}`);
      }
    }

    if (this.AUDIO_FORMATS.includes(targetExt)) {
      return this.convertAudio(inputPath, outputPath, options);
    }

    let videoCodec = '-c:v libx264 -crf 22 -preset medium -c:a aac -b:a 128k';
    if (targetExt === 'webm') {
      videoCodec = '-c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus';
    }

    const cmd = `ffmpeg -y -i "${resolvedInput}" ${videoCodec} -movflags +faststart "${resolvedOutput}"`;
    try {
      await execAsync(cmd);
      if (fs.existsSync(resolvedOutput)) {
        return {
          success: true,
          engine: 'FFmpeg Fast Video Transcoder',
          outputPath: resolvedOutput,
          size: fs.statSync(resolvedOutput).size
        };
      }
    } catch (err) {
      throw new Error(`视频转码失败: ${err.message}`);
    }
    throw new Error('视频转码未生成输出文件');
  }

  static async convertSpecialImage(inputPath, outputPath) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`文件不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);

    const cmd = `ffmpeg -y -i "${resolvedInput}" "${resolvedOutput}"`;
    try {
      await execAsync(cmd);
      if (fs.existsSync(resolvedOutput)) {
        return {
          success: true,
          engine: 'FFmpeg Image Decoder',
          outputPath: resolvedOutput,
          size: fs.statSync(resolvedOutput).size
        };
      }
    } catch (err) {
      throw new Error(`图像格式解码失败: ${err.message}`);
    }
    throw new Error('图像格式解码未生成输出文件');
  }
}

module.exports = MediaEngine;

import { parse } from '@yarnpkg/lockfile';
import { logger } from '../../../logger';
import { readLocalFile } from '../../../util/fs';
import { LockFileEntry } from './common';

export type YarnLock = Record<string, string> & {
  '@renovate_yarn_integrity'?: boolean;
};

export async function getYarnLock(filePath: string): Promise<YarnLock> {
  const yarnLockRaw = await readLocalFile(filePath, 'utf8');
  try {
    const yarnLockParsed = parse(yarnLockRaw);
    // istanbul ignore if
    if (yarnLockParsed.type !== 'success') {
      logger.debug(
        { filePath, parseType: yarnLockParsed.type },
        'Error parsing yarn.lock - not success'
      );
      return {};
    }
    const lockFile: YarnLock = {};

    for (const [entry, val] of Object.entries(
      yarnLockParsed.object as LockFileEntry
    )) {
      logger.trace({ entry, version: val.version });
      lockFile[entry] = val.version;
      // istanbul ignore if
      if (val.integrity) {
        lockFile['@renovate_yarn_integrity'] = true;
      }
    }
    return lockFile;
  } catch (err) {
    logger.debug({ filePath, err }, 'Warning: Exception parsing yarn.lock');
    return {};
  }
}
